# 1. Microservices as the Primary Architecture Style

Date: 2026-05-12

## Status

Accepted

- Consulted: Annete, Hector, Monserrat, Sarah, Anett
## Context.

The system is a project management tool for software development teams, integrating a web portal, a Telegram chatbot, AI-powered conversation analysis, and task management. The requirements specify:

- Independent deployable components: React.js frontend, Spring Boot backend services, Telegram chatbot, and an AI analysis module.
- Containerization of all components as Docker images deployed via Kubernetes on Oracle Cloud Infrastructure (OCI).
- A REST API as the communication contract between the frontend and the backend.
- Support for approximately 50 concurrent users with horizontal autoscaling when needed.
- Role-based access control (RBAC) requiring isolated authorization logic per service.
- Two distinct user-facing channels (web portal and Telegram), each with different interaction patterns and data flows.

## Decision.

We use Microservices as the dominant architectural style for the whole system.
It directly satisfies the requirement to package each component as a Docker image, deploy through Kubernetes on OCI, expose each service through its own REST API, and scale each component independently. The two distinct user facing channels map onto two independently deployable services which are the React frontend and the Telegram Bot Service, and the Dashboard Backend and AI capability are isolated in its own service that can be updated or swapped without touching the rest of the system.


## Alternatives considered.

**Big Ball of Mud** was dismissed immediately. It represents a complete absence of intentional architecture, characterized by logic wired directly to database calls with no internal structure. Our SRS explicitly calls for modular, maintainable, and secure components, which is incompatible with this pattern.

**Layered** is well-suited for organizing code within a single deployable unit but does not address multi-channel deployment. It cannot express the separation between the web portal and the Telegram bot as independently operated components.

**Pipeline** is oriented toward sequential data transformation workflows, such as ETL pipelines or stream processors. The system's primary interaction model is interactive request/response from users not a transformation pipeline so this style does not fit.

**Microkernel** is designed around a stable core with swappable plugins. The system has no plugin ecosystem requirement at this stage; all integrations (Telegram, AI, Oracle) are fixed by the formative partner constraints, making the extensibility overhead of this style unnecessary.

**Service-based** was considered as a less complex alternative to microservices. However, it typically groups services at a coarser granularity and shares a single deployment pipeline. The Telegram channel and the web portal require distinct deployment cycles, scaling policies, and runtime lifecycles, which a service-based topology would not cleanly support.

**Event-driven** would require an asynchronous message broker. Those infrastructure werent requested, and the AI conversation analysis flow uses synchronous calls triggered by the command rather than an event stream. Introducing a broker would add significant operational complexity.

**Space-based** is engineered for extreme horizontal scalability under massive concurrent load typically thousands of simultaneous users. We target approximately 50 concurrent users, making this style heavily over-engineered and operationally impractical for a student team.

**SOA** relies on an enterprise service bus as the central communication backbone. We use REST APIs between components with no ESB layer, which doesn't match SOA topology.





## Consequences.

**Positive:**
- Each service can be scaled, updated, and redeployed independently, satisfying the OCI requirement.
- The Telegram Bot Service and the AI Analysis Service can evolve or be replaced without affecting the web portal.
- Clear ownership boundaries align with the team's modular code structure (backend / frontend / chatbot / database).
- HTTPS between all services and an API Gateway enforces the security policy across components.

**Negative:**
- Having multiple services running separately makes the system harder to debug: each service writes its own logs, calls between services add delays, and changing how two services talk to each other must be done carefully to avoid breaking things.
- Setting up Kubernetes on OCI takes time to learn and adds configuration work that a simpler application would not require.

- Deploying a fix requires pushing and restarting the affected service container, which takes longer than simply restarting a single local application.

- If the connection between two services fails mid-operation, the system may end up in an inconsistent state.

 -Cost