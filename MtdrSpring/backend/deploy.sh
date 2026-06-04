#!/bin/bash

set -e

SCRIPT_DIR=$(pwd)

# Validation
if [ -z "$DOCKER_REGISTRY" ]; then
    export DOCKER_REGISTRY=$(state_get DOCKER_REGISTRY)
    echo "DOCKER_REGISTRY set."
fi
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY env variable needs to be set!"
    exit 1
fi

if [ -z "$TODO_PDB_NAME" ]; then
    export TODO_PDB_NAME=$(state_get MTDR_DB_NAME)
    echo "TODO_PDB_NAME set."
fi
if [ -z "$TODO_PDB_NAME" ]; then
    echo "Error: TODO_PDB_NAME env variable needs to be set!"
    exit 1
fi

if [ -z "$OCI_REGION" ]; then
    echo "OCI_REGION not set. Will get it with state_get"
    export OCI_REGION=$(state_get REGION)
fi
if [ -z "$OCI_REGION" ]; then
    echo "Error: OCI_REGION env variable needs to be set!"
    exit 1
fi

if [ -z "$UI_USERNAME" ]; then
    echo "UI_USERNAME not set. Will get it with state_get"
    export UI_USERNAME=$(state_get UI_USERNAME)
fi
if [ -z "$UI_USERNAME" ]; then
    echo "Error: UI_USERNAME env variable needs to be set!"
    exit 1
fi

echo "Creating springboot deployment and service"

export CURRENTTIME=$(date '+%F_%H:%M:%S')
echo "CURRENTTIME is $CURRENTTIME ... this will be appended to generated deployment yaml"

MANIFEST_FILE="$SCRIPT_DIR/todolistapp-springboot-$CURRENTTIME.yaml"

cp src/main/resources/todolistapp-springboot.yaml "$MANIFEST_FILE"

sed -i "s|%DOCKER_REGISTRY%|${DOCKER_REGISTRY}|g" "$MANIFEST_FILE"
sed -i "s|%TODO_PDB_NAME%|${TODO_PDB_NAME}|g" "$MANIFEST_FILE"
sed -i "s|%OCI_REGION%|${OCI_REGION}|g" "$MANIFEST_FILE"
sed -i "s|%UI_USERNAME%|${UI_USERNAME}|g" "$MANIFEST_FILE"

echo "Applying generated Kubernetes manifest: $MANIFEST_FILE"

if [ -z "$1" ]; then
    kubectl apply -f "$MANIFEST_FILE" -n mtdrworkshop
else
    kubectl apply -f <(istioctl kube-inject -f "$MANIFEST_FILE") -n mtdrworkshop
fi

echo "Applying persistent observability configuration..."

# Ensure service label required by ServiceMonitor
kubectl -n mtdrworkshop label svc todolistapp-springboot-service app=todolistapp-springboot --overwrite || true

# Ensure service port has the name required by ServiceMonitor: port: http
kubectl -n mtdrworkshop patch svc todolistapp-springboot-service --type='json' \
  -p='[{"op":"replace","path":"/spec/ports/0/name","value":"http"}]' || \
kubectl -n mtdrworkshop patch svc todolistapp-springboot-service --type='json' \
  -p='[{"op":"add","path":"/spec/ports/0/name","value":"http"}]' || true

# Ensure Actuator/Prometheus endpoints remain exposed after every deploy
kubectl -n mtdrworkshop set env deployment/todolistapp-springboot-deployment \
  MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE="health,info,metrics,prometheus" \
  MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS="always" \
  MANAGEMENT_ENDPOINT_PROMETHEUS_ENABLED="true" \
  MANAGEMENT_METRICS_TAGS_APPLICATION="todolistapp-springboot" \
  --containers=todolistapp-springboot

# Ensure Kubernetes requests/limits remain set after every deploy
kubectl -n mtdrworkshop set resources deployment/todolistapp-springboot-deployment \
  --containers=todolistapp-springboot \
  --requests=cpu=100m,memory=512Mi \
  --limits=cpu=500m,memory=1Gi

# Apply ServiceMonitor only if the observability stack exists
if kubectl get namespace observability >/dev/null 2>&1 && kubectl get crd servicemonitors.monitoring.coreos.com >/dev/null 2>&1; then
    echo "Applying ServiceMonitor for todolistapp..."

    kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: todolistapp-monitor
  namespace: observability
  labels:
    release: monitoring
spec:
  namespaceSelector:
    matchNames:
      - mtdrworkshop
  selector:
    matchLabels:
      app: todolistapp-springboot
  endpoints:
    - port: http
      path: /actuator/prometheus
      interval: 15s
EOF

else
    echo "Observability namespace or ServiceMonitor CRD not found. Skipping ServiceMonitor apply."
fi

echo "Waiting for deployment rollout..."

kubectl rollout status deployment/todolistapp-springboot-deployment -n mtdrworkshop

echo "Deployment completed with persistent observability configuration."
