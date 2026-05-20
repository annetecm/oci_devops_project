# 2. Availability over Simplicity

Date: 2026-03-09

## Status

Accepted

- Consulted: Héctor, Anett, Monserrat, Sarah, Annete
## Context.
 
The project management tool supports communication between Project Leaders and Developers through a web portal and a Telegram chatbot. The platform acts as a central coordination hub for assigning tasks, tracking progress, and capturing conversation-driven action items.
 
Because the system is the single point of coordination for development teams, any service interruption could prevent Project Leaders from assigning tasks, Developers from receiving updates, or the Telegram bot from capturing task instructions mid-conversation. This directly impacts team productivity and project tracking reliability.
 
Achieving higher availability requires additional architectural mechanisms: rolling deployments, Kubernetes liveness and readiness health checks, retry and reconnection logic between services, and redundancy at the infrastructure level via OCI Fault Domains. These mechanisms increase architectural complexity and operational effort compared to a simpler single-node design.
 
The team is a student group operating under a fixed timeline and limited infrastructure budget, which makes over-engineering a real risk. However, the academic evaluation criteria explicitly requires a deployable, continuously available system on OCI.
 
## Decision.
 
We prioritize **availability over simplicity**.
 
The system is deployed on Oracle Kubernetes Engine (OKE) with:
- A dedicated OCI Load Balancer routing traffic into the cluster.
- All microservices containerized and managed as Kubernetes Pods, enabling automatic restarts on failure.
- A single Availability Domain with one Fault Domain (expandable) to isolate workloads from hardware failures.
- A Service Gateway providing private, reliable access to Oracle Autonomous Database and Google Gemini without routing through the public internet.
- Health checks and rolling deployment strategies configured at the pod level to eliminate downtime during updates.
The added complexity is justified because uninterrupted access to the application is a client requirement, not an optional quality attribute.
 
## Alternatives Considered.
 
**Simplicity (single deployable unit):** A monolithic or single-VM deployment would minimize infrastructure components and reduce configuration overhead. It would be faster to develop and easier to debug locally. However, any deployment or failure would take the entire system offline, directly violating the availability requirement. Ruled out.
 
**Availability with full multi-region redundancy:** Deploying across multiple OCI regions would maximize fault tolerance. We believe this would result impractical for the scope of the proyect and the resources within the project timeline and budget. Ruled out as over-engineering.

## Consequences.
 
**Positive:**
- The system remains accessible during pod restarts, rolling updates, and minor infrastructure failures.
- Task tracking and Telegram bot interactions are not interrupted by partial service disruptions.
- Communication between managers and developers through the portal and chatbot will be
more reliable.

**Negative:**
- The architecture becomes more complex due to additional availability mechanisms.
- Development and operational effort increases because monitoring, deployment strategies, and failure handling must be implemented
- Infrastructure and OCI compute costs are higher than a single-VM deployment.