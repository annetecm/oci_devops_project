# PlantUML Component Diagrams

This directory contains automated PlantUML class diagrams for all Level 3 components of the OCI DevOps project.

## Quick Links

- 📋 **[CONFIGURATION.md](CONFIGURATION.md)** - Complete setup and customization guide
- 🚀 **[generate-diagrams.bat](generate-diagrams.bat)** - Windows script to generate diagrams
- 🐧 **[generate-diagrams.sh](generate-diagrams.sh)** - Unix/Linux/macOS script to generate diagrams

## What's Generated

14 separate PlantUML class diagrams organized by component type:

- **Controllers/** - 6 diagrams (AuthController, DashboardController, TaskController, ToDoItemBotController, ToDoItemController, UserController)
- **Services/** - 3 diagrams (GeminiService, TelegramMessageService, TelegramSummaryService)
- **Repositories/** - 5 diagrams (TaskRepository, TelegramMessageRepository, TelegramSummaryRepository, ToDoItemRepository, UserRepository)

## Generate Diagrams

### Windows
```cmd
.\generate-diagrams.bat
```

### Unix/Linux/macOS
```bash
bash generate-diagrams.sh
```

### Manual (Any OS)
```bash
cd ../../MtdrSpring/backend
mvn clean compile exec:java -Dexec.mainClass="com.springboot.MyTodoList.util.PlantUMLDiagramGenerator"
```

## Directory Structure After Generation

```
plantUML/
├── Controllers/
│   ├── AuthController.puml
│   ├── DashboardController.puml
│   ├── TaskController.puml
│   ├── ToDoItemBotController.puml
│   ├── ToDoItemController.puml
│   └── UserController.puml
├── Services/
│   ├── GeminiService.puml
│   ├── TelegramMessageService.puml
│   └── TelegramSummaryService.puml
├── Repositories/
│   ├── TaskRepository.puml
│   ├── TelegramMessageRepository.puml
│   ├── TelegramSummaryRepository.puml
│   ├── ToDoItemRepository.puml
│   └── UserRepository.puml
└── Configuration files...
```

## Documentation

See [CONFIGURATION.md](CONFIGURATION.md) for:
- Detailed architecture explanation
- Component descriptions
- Customization instructions
- Troubleshooting guide
- CI/CD integration examples

