workspace "Synkra" "Architecture model for the Synkra project management platform." {

    !identifiers hierarchical
    !adrs doc/arch

    model {

       
        # People / Actors
    
        projectLeader = person "Project Leader" "Monitors team tasks and productivity stats via the web portal; communicates with developers on Telegram." "ProjectLeader"
        developer     = person "Developer"       "Manages personal tasks via the web portal and Telegram bot; chats with the Project Leader in group chats." "Developer"

       
        # External Software Systems
   
        telegram = softwareSystem "Telegram" "Third-party messaging platform used for group chats between the Project Leader and each Developer, and for private bot interactions." "External"
        ociCloud = softwareSystem "Oracle Cloud Infrastructure (OCI)" "Cloud infrastructure hosting the Oracle Autonomous Database, OCI Container Registry, and Kubernetes cluster for application deployment." "External"
        gemini   = softwareSystem "Google Gemini" "External LLM used by the AI Processing Service to generate task summaries, suggestions, and action items from conversation context." "External"

        
        # Synkra — Internal System
      
        group "Synkra System" {

            synkra = softwareSystem "Synkra" "Web-based project management tool with AI-powered Telegram chatbot integration for task tracking and team communication." "Internal" {

                webPortal   = container "Web Portal"            "Single-page application that provides role-based dashboards, task management views, and performance graphs for both Project Leaders and Developers." "React / JavaScript" "WebBrowser"
                backendApi = container "Backend API" "Central REST API gateway exposing task management, dashboard, Telegram bot, and AI-assisted endpoints." "Java / Spring Boot" {

                    authController = component "AuthController" "Handles authentication endpoints." "Spring REST Controller"
                    taskController = component "TaskController" "Handles CRUD operations for tasks." "Spring REST Controller"
                    dashboardController = component "Dashboardcontroller" "Provides dashboard and productivity statistics." "Spring REST Controller"
                    userController = component "UserController" "Handles user-related operations." "Spring REST Controller"
                    todoItemController = component "ToDoItemController" "Handles to-do item management." "Spring REST Controller"
                    todoItemBotController = component "ToDoItemBotController" "Telegram bot controller handling Telegram commands and interactions." "Spring Component"
                    geminiService = component "GeminiService" "Communicates with Google Gemini for AI-generated summaries and task suggestions." "Spring Service"
                    telegramSummaryService = component "TelegramSummaryService" "Processes Telegram conversation history and generates summaries." "Spring Service"
                    telegramMessageService = component "TelegramMessageService" "Stores and retrieves Telegram chat messages." "Spring Service"
                    userRepository = component "UserRepository" "Persistence access for users." "Spring Data JPA Repository"
                    taskRepository = component "TaskRepository" "Persistence access for tasks." "Spring Data JPA Repository"
                    telegramMessageRepository = component "TelegramMessageRepository" "Persistence access for Telegram messages." "Spring Data JPA Repository"
                    telegramSummaryRepository = component "TelegramSummaryRepository" "Persistence access for Telegram summaries." "Spring Data JPA Repository"
                    todoItemRepository = component "ToDoItemRepository" "Persistence access for to-do items." "Spring Data JPA Repository"
                }
                taskService = container "Task Service"          "Domain service encapsulating all task lifecycle logic: create, read, update, delete, and assignment. Enforces business rules such as developer-only task ownership." "Java / Spring Boot" 
                aiService   = container "AI Processing Service" "Performs RAG-based NLP on conversation history using Oracle AI Vector Search with ALL-MiniLM-L6-v2 embeddings and Google Gemini for generation. Identifies task instructions and produces summaries." "Java / Spring Boot"
                botService  = container "Telegram Bot Service"  "Connects to the Telegram Bot API, routes incoming messages and commands to the appropriate internal service and sends responses back to Telegram." "Java / Spring Boot"
                oracleDb    = container "Oracle Database"       "Primary persistent store for users, roles, teams, projects, tasks, conversation history, and vector embeddings for RAG-based semantic search via Oracle AI Vector Search." "Oracle DB (OCI)" "Database"
            }
        }

        # Deployment Environment

        production = deploymentEnvironment "Production" {

            externalServices = deploymentNode "External Services" "Third-party external platforms." {
                webPageNode  = infrastructureNode "Web Page"          "React SPA served to end users."
                telegramNode = infrastructureNode "Telegram Bot API"  "Telegram messaging platform and bot API."
                geminiNode   = infrastructureNode "Google Gemini API" "LLM: gemini-2.5-flash"
            }

            ociRegion = deploymentNode "Oracle Cloud Region - Queretaro" "Primary OCI region hosting Synkra infrastructure." "Oracle Cloud Infrastructure" {

                ociAiNode      = infrastructureNode "OCI AI Embeddings" "Generates vector embeddings using ALL_MiniLM_L12_V2 for RAG-based semantic search."
                serviceGateway = infrastructureNode "Service Gateway"   "Provides private access to Oracle services and Google Gemini without traversing the internet."

                databaseNode = deploymentNode "Oracle Autonomous Database 23ai" "Persistent store for chat messages, vector embeddings, and cosine similarity search." "Oracle Database 23ai" {
                    dbInstance = containerInstance synkra.oracleDb
                }

                availabilityDomain = deploymentNode "Availability Domain 1" "Primary availability domain." "OCI Availability Domain" {
                    faultDomain = deploymentNode "Fault Domain 1" "Fault-isolated domain for application workloads." "OCI Fault Domain" {

                        loadBalancer = infrastructureNode "OCI Load Balancer" "Routes HTTPS traffic to Synkra services."

                        okeCluster = deploymentNode "Oracle Kubernetes Engine" "Hosts Synkra application workloads." "OKE / Kubernetes" {
                            workerNode = deploymentNode "Worker Node" "Kubernetes worker node running all Synkra microservices." "Virtual Machine" {
                                frontendPod = deploymentNode "Frontend Pod" "Runs the React SPA." "Docker Container" {
                                    frontendInstance = containerInstance synkra.webPortal
                                }
                                backendPod = deploymentNode "Backend API Pod" "Runs the Spring Boot REST API gateway." "Docker Container" {
                                    backendInstance = containerInstance synkra.backendApi
                                }
                                taskPod = deploymentNode "Task Service Pod" "Runs task lifecycle management microservice." "Docker Container" {
                                    taskInstance = containerInstance synkra.taskService
                                }
                                aiPod = deploymentNode "AI Processing Pod" "Runs RAG-based NLP and summarization microservice." "Docker Container" {
                                    aiInstance = containerInstance synkra.aiService
                                }
                                botPod = deploymentNode "Telegram Bot Pod" "Runs the Telegram bot microservice." "Docker Container" {
                                    botInstance = containerInstance synkra.botService
                                }
                            }
                        }
                    }
                }
            }
        }

        # Relationships — Landscape
       
        ls_pl_synkra      = projectLeader -> synkra   "Views team dashboards, productivity stats, and sends messages via"
        ls_dev_synkra     = developer     -> synkra   "Manages tasks, views personal stats, and chats via"
        ls_pl_telegram    = projectLeader -> telegram "Sends messages to developers using"
        ls_dev_telegram   = developer     -> telegram "Chats with Project Leader and interacts with bot using"
        ls_synkra_tg      = synkra -> telegram  "Sends and receives messages via the Bot API"
        ls_synkra_oci     = synkra -> ociCloud  "Deployed on, uses Oracle DB"
        ls_synkra_gemini  = synkra -> gemini    "Sends conversation context and receives generated summaries and task suggestions from" "HTTPS"

        
        # Relationships — Context
       
        ctx_pl_synkra     = projectLeader -> synkra   "Views team dashboards, individual and general productivity stats, and logs in via"
        ctx_dev_synkra    = developer     -> synkra   "Logs in, creates, edits, and deletes tasks, views personal dashboard and stats via"
        ctx_pl_telegram   = projectLeader -> telegram "Sends messages to developers through group chats on"
        ctx_dev_telegram  = developer     -> telegram "Chats with Project Leader, requests summaries, and manages tasks via bot commands on"
        ctx_synkra_tg     = synkra -> telegram  "Connects to the Bot API to send/receive messages, commands, and notifications"
        ctx_synkra_oci    = synkra -> ociCloud  "Persists all application data in Oracle Autonomous DB, hosted on"
        ctx_synkra_gemini = synkra -> gemini    "Sends conversation context and receives AI-generated summaries and task suggestions from" "HTTPS"

       
        # Relationships — Containers: actors → containers
        
        ctr_pl_portal    = projectLeader -> synkra.webPortal "Opens dashboards and productivity graphs using"               "HTTPS"
        ctr_dev_portal   = developer     -> synkra.webPortal "Views personal dashboard, creates/edits/deletes tasks using"  "HTTPS"
        ctr_pl_telegram  = projectLeader -> telegram          "Sends messages to developers via group chats on"
        ctr_dev_telegram = developer     -> telegram          "Chats with Project Leader and issues bot commands on"

        
        # Relationships — Containers: container → container

        synkra.webPortal   -> synkra.backendApi  "Sends all API requests to"                                                "JSON / HTTPS"
        synkra.backendApi  -> synkra.taskService "Delegates task lifecycle operations to"                                    "JSON / HTTPS"
        synkra.backendApi  -> synkra.aiService   "Forwards conversation history for analysis and summary generation to"     "JSON / HTTPS"
        synkra.backendApi  -> synkra.oracleDb    "Reads and writes users, roles, teams, KPI data to"                       "SQL / Oracle JDBC"
        synkra.taskService -> synkra.oracleDb    "Reads and writes tasks and project records to"                            "SQL / Oracle JDBC"
        synkra.aiService   -> synkra.oracleDb    "Retrieves conversation history from"                                      "SQL / Oracle JDBC"
        synkra.aiService   -> synkra.oracleDb    "Queries vector embeddings via Oracle AI Vector Search for RAG retrieval"  "SQL / JDBC"
        synkra.aiService   -> gemini             "Sends prompts with conversation context and receives generated text from"  "HTTPS"
        synkra.botService  -> telegram           "Sends and receives messages, commands, and button events via the Bot API using" "HTTPS"
        synkra.botService  -> synkra.backendApi  "Forwards task commands and triggers AI analysis via"                      "JSON / HTTPS"
        synkra.botService  -> synkra.oracleDb    "Persists group-chat message history in"                                   "SQL / Oracle JDBC"

        # Relationships — Components

        synkra.webPortal -> synkra.backendApi.authController "Authenticates users via" "JSON / HTTPS"
        synkra.webPortal -> synkra.backendApi.taskController "Manages tasks through" "JSON / HTTPS"
        synkra.webPortal -> synkra.backendApi.dashboardController "Retrieves dashboard statistics from" "JSON / HTTPS"
        synkra.webPortal -> synkra.backendApi.todoItemController "Manages to-do items through" "JSON / HTTPS"
        synkra.webPortal -> synkra.backendApi.userController "Retrieves user information from" "JSON / HTTPS"
        synkra.backendApi.taskController -> synkra.backendApi.taskRepository "Reads and writes tasks using"
        synkra.backendApi.dashboardController -> synkra.backendApi.taskRepository "Retrieves productivity metrics from"
        synkra.backendApi.userController -> synkra.backendApi.userRepository "Reads and writes user data using"
        synkra.backendApi.todoItemController -> synkra.backendApi.todoItemRepository "Reads and writes to-do items using"
        synkra.backendApi.todoItemBotController -> synkra.backendApi.telegramMessageService "Processes Telegram messages using"
        synkra.backendApi.todoItemBotController -> synkra.backendApi.telegramSummaryService "Requests conversation summaries from"
        synkra.backendApi.telegramSummaryService -> synkra.backendApi.geminiService "Requests AI-generated summaries from"
        synkra.backendApi.telegramMessageService -> synkra.backendApi.telegramMessageRepository "Stores Telegram messages using"
        synkra.backendApi.telegramSummaryService -> synkra.backendApi.telegramSummaryRepository "Stores generated summaries using"
        synkra.backendApi.userRepository -> synkra.oracleDb "Reads and writes data to" "SQL / Oracle JDBC"
        synkra.backendApi.taskRepository -> synkra.oracleDb "Reads and writes data to" "SQL / Oracle JDBC"
        synkra.backendApi.telegramMessageRepository -> synkra.oracleDb "Reads and writes data to" "SQL / Oracle JDBC"
        synkra.backendApi.telegramSummaryRepository -> synkra.oracleDb "Reads and writes data to" "SQL / Oracle JDBC"
        synkra.backendApi.todoItemRepository -> synkra.oracleDb "Reads and writes data to" "SQL / Oracle JDBC"
        telegram -> synkra.backendApi.todoItemBotController "Delivers Telegram bot updates to" "HTTPS"
        synkra.backendApi.todoItemBotController -> telegram "Sends Telegram bot responses via" "HTTPS"
        synkra.backendApi.geminiService -> gemini "Requests AI-generated summaries and suggestions from" "HTTPS"
    
        # Relationships — Deployment

        production.externalServices.webPageNode -> production.ociRegion.availabilityDomain.faultDomain.loadBalancer "Sends HTTPS requests to" "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.frontendPod.frontendInstance -> production.ociRegion.availabilityDomain.faultDomain.loadBalancer "Sends HTTPS requests to"          "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.loadBalancer -> production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.frontendPod.frontendInstance  "Routes traffic to frontend"       "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.loadBalancer -> production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.backendPod.backendInstance    "Routes traffic to backend API"    "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.backendPod.backendInstance -> production.ociRegion.serviceGateway "Routes outbound backend calls via"  "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.taskPod.taskInstance       -> production.ociRegion.serviceGateway "Routes outbound task calls via"     "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.aiPod.aiInstance           -> production.ociRegion.serviceGateway "Routes outbound AI calls via"       "HTTPS"
        production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.botPod.botInstance         -> production.ociRegion.serviceGateway "Routes outbound bot messages via"   "HTTPS"
        production.ociRegion.serviceGateway -> production.externalServices.geminiNode        "Forwards prompts to"                    "HTTPS"
        production.ociRegion.serviceGateway -> production.ociRegion.databaseNode.dbInstance  "Persists and retrieves data via"        "SQL / Oracle JDBC"
        production.externalServices.telegramNode -> production.ociRegion.ociAiNode           "Sends conversation history for embedding generation to" "HTTPS"
        production.ociRegion.ociAiNode -> production.ociRegion.databaseNode.dbInstance       "Stores generated vector embeddings in"  "OCI SDK"
        production.externalServices.telegramNode -> production.ociRegion.availabilityDomain.faultDomain.okeCluster.workerNode.botPod.botInstance "Delivers bot updates to" "HTTPS"
    }

    views {

        # Level 0: System Landscape
        systemLandscape "SystemLandscape"  {
            include projectLeader developer synkra telegram ociCloud gemini
            exclude ctx_pl_synkra
            exclude ctx_dev_synkra
            exclude ctx_pl_telegram
            exclude ctx_dev_telegram
            exclude ctx_synkra_tg
            exclude ctx_synkra_oci
            exclude ctx_synkra_gemini
            exclude ctr_pl_portal
            exclude ctr_dev_portal
            exclude ctr_pl_telegram
            exclude ctr_dev_telegram
            autoLayout lr
        }

        # ── Level 1: System Context
        systemContext synkra "SystemContext"  {
            include projectLeader developer synkra telegram ociCloud gemini
            exclude ls_pl_synkra
            exclude ls_dev_synkra
            exclude ls_pl_telegram
            exclude ls_dev_telegram
            exclude ls_synkra_tg
            exclude ls_synkra_oci
            exclude ls_synkra_gemini
            exclude ctr_pl_portal
            exclude ctr_dev_portal
            exclude ctr_pl_telegram
            exclude ctr_dev_telegram
            autoLayout lr
        }

        # Level 2: Containers 
        container synkra "Containers"  {
            include *
            exclude ls_pl_synkra
            exclude ls_dev_synkra
            exclude ls_pl_telegram
            exclude ls_dev_telegram
            exclude ls_synkra_tg
            exclude ls_synkra_oci
            exclude ls_synkra_gemini
            exclude ctx_pl_synkra
            exclude ctx_dev_synkra
            exclude ctx_pl_telegram
            exclude ctx_dev_telegram
            exclude ctx_synkra_tg
            exclude ctx_synkra_oci
            exclude ctx_synkra_gemini
            autoLayout lr
        }

        # Level 3: Components
        component synkra.backendApi "Components" {
            include *
            exclude ls_pl_synkra
            exclude ls_dev_synkra
            exclude ls_pl_telegram
            exclude ls_dev_telegram
            exclude ls_synkra_tg
            exclude ls_synkra_oci
            exclude ls_synkra_gemini
            exclude ctx_pl_synkra
            exclude ctx_dev_synkra
            exclude ctx_pl_telegram
            exclude ctx_dev_telegram
            exclude ctx_synkra_tg
            exclude ctx_synkra_oci
            exclude ctx_synkra_gemini
            autoLayout lr
        }

        # Level 4: Deployment
        deployment synkra production "Deployment" {
            include *
            autoLayout lr
        }

        #Level 5: Dynamic
        dynamic synkra.backendApi "CreateTask" "Summarises how a Developer creates a task via the Web Portal." {
            developer                              -> synkra.webPortal                        "Navigates to task creation form, fills and confirm it"
            synkra.webPortal                       -> synkra.backendApi.taskController        "POST /tasks with task data"          "JSON / HTTPS"
            synkra.backendApi.taskController       -> synkra.backendApi.taskRepository        "Persists new task using"
            synkra.backendApi.taskRepository       -> synkra.oracleDb                         "INSERT INTO tasks"                   "SQL / Oracle JDBC"
            synkra.oracleDb                        -> synkra.backendApi.taskRepository        "Returns saved task"
            synkra.backendApi.taskRepository       -> synkra.backendApi.taskController        "Returns saved task to"
            synkra.backendApi.taskController       -> synkra.webPortal                        "Returns 201 Created with task data"  "JSON / HTTPS"
            synkra.webPortal                       -> developer                               "Displays confirmation and updated task list"

            autoLayout lr
        }

        styles {
            element "Person" {
                shape Person
                background #1168bd
                color #ffffff
                fontSize 14
            }
            element "ProjectLeader" {
                background #0d4f8b
            }
            element "Developer" {
                background #1a7abf
            }
            element "Software System" {
                background #2d6a9f
                color #ffffff
            }
            element "Internal" {
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "WebBrowser" {
                shape WebBrowser
                background #5b9bd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #2e6da4
                color #ffffff
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Boundary" {
                strokeWidth 3
            }
            relationship "Relationship" {
                thickness 2
            }
        }
    }
}