package com.springboot.MyTodoList.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import de.elnarion.util.plantuml.generator.classdiagram.PlantUMLClassDiagramGenerator;
import de.elnarion.util.plantuml.generator.classdiagram.config.PlantUMLClassDiagramConfigBuilder;

/**
 * Utility class to generate PlantUML class diagrams for each Level 3 Component.
 * Generates separate .puml files for Controllers, Services, and Repositories.
 */
public class PlantUMLDiagramGenerator {

    // When running from the backend module this should point to the repository-level
    // architecture/plantUML directory. Using a relative path here so the generator
    // writes to the repo root: MtdrSpring/backend -> ../../architecture/plantUML
    private static final Path OUTPUT_DIR = Paths.get("..", "..", "architecture", "plantUML");

    // Fully-qualified class names for Level 3 components. The generator will
    // use a whitelist regexp to produce a diagram for that single class only.
    private static final List<ComponentConfig> COMPONENTS = List.of(
        // Controllers (FQCN)
        new ComponentConfig("com.springboot.MyTodoList.controller.AuthController",             "Controllers/AuthController.puml"),
        new ComponentConfig("com.springboot.MyTodoList.controller.TaskController",             "Controllers/TaskController.puml"),
        new ComponentConfig("com.springboot.MyTodoList.controller.Dashboardcontroller",        "Controllers/DashboardController.puml"),
        new ComponentConfig("com.springboot.MyTodoList.controller.UserController",             "Controllers/UserController.puml"),
        new ComponentConfig("com.springboot.MyTodoList.controller.ToDoItemController",         "Controllers/ToDoItemController.puml"),
        new ComponentConfig("com.springboot.MyTodoList.controller.ToDoItemBotController",      "Controllers/ToDoItemBotController.puml"),
        // Services
        new ComponentConfig("com.springboot.MyTodoList.service.GeminiService",                "Services/GeminiService.puml"),
        new ComponentConfig("com.springboot.MyTodoList.service.TelegramSummaryService",        "Services/TelegramSummaryService.puml"),
        new ComponentConfig("com.springboot.MyTodoList.service.TelegramMessageService",        "Services/TelegramMessageService.puml"),
        // Repositories
        new ComponentConfig("com.springboot.MyTodoList.repository.UserRepository",             "Repositories/UserRepository.puml"),
        new ComponentConfig("com.springboot.MyTodoList.repository.TaskRepository",             "Repositories/TaskRepository.puml"),
        new ComponentConfig("com.springboot.MyTodoList.repository.TelegramMessageRepository",  "Repositories/TelegramMessageRepository.puml"),
        new ComponentConfig("com.springboot.MyTodoList.repository.TelegramSummaryRepository",  "Repositories/TelegramSummaryRepository.puml"),
        new ComponentConfig("com.springboot.MyTodoList.repository.ToDoItemRepository",         "Repositories/ToDoItemRepository.puml")
    );

    public static void main(String[] args) throws IOException {
        PlantUMLDiagramGenerator generator = new PlantUMLDiagramGenerator();
        generator.generateAllDiagrams();
    }

    /**
     * Generate all component diagrams.
     */
    public void generateAllDiagrams() throws IOException {
        System.out.println("Generating PlantUML diagrams for all components...");
        if (!Files.exists(OUTPUT_DIR)) {
            Files.createDirectories(OUTPUT_DIR);
            System.out.println("Created output directory: " + OUTPUT_DIR.toAbsolutePath());
        }

        for (ComponentConfig config : COMPONENTS) {
            generateDiagram(config);
        }

        System.out.println("All diagrams generated successfully!");
    }

    /**
     * Generate a single component diagram using a whitelist regexp so that
     * only the target class (and its inner classes) appears in the output.
     */
    private void generateDiagram(ComponentConfig config) throws IOException {
        try {
            String fqcn = config.componentPath;
            String packageName = fqcn.substring(0, fqcn.lastIndexOf('.'));
            String simpleClassName = fqcn.substring(fqcn.lastIndexOf('.') + 1);

            List<String> scanPackages = new ArrayList<>();
            scanPackages.add(packageName);

            // Whitelist regexp: matches only this specific class (and any inner classes)
            String whitelistRegexp = ".*\\." + simpleClassName + "(\\$.*)?";

            PlantUMLClassDiagramConfigBuilder configBuilder =
                new PlantUMLClassDiagramConfigBuilder(scanPackages, whitelistRegexp);
            PlantUMLClassDiagramGenerator plantUMLGenerator =
                new PlantUMLClassDiagramGenerator(configBuilder.build());

            String diagramText = plantUMLGenerator.generateDiagramText();

            // Create subdirectories if needed
            Path filePath = OUTPUT_DIR.resolve(config.outputPath);
            Files.createDirectories(filePath.getParent());

            // Write diagram to file
            Files.writeString(filePath, diagramText);
            System.out.println("Generated: " + filePath.toAbsolutePath());

        } catch (Exception e) {
            System.err.println("Failed to generate diagram for " + config.componentPath + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Configuration for a single component.
     */
    private static class ComponentConfig {
        String componentPath; // FQCN of the target class
        String outputPath;    // relative path under OUTPUT_DIR

        ComponentConfig(String componentPath, String outputPath) {
            this.componentPath = componentPath;
            this.outputPath = outputPath;
        }
    }
}