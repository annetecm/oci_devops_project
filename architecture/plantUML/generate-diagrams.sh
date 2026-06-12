#!/bin/bash
# Generate PlantUML diagrams for all Level 3 components
# This script compiles the project and runs the diagram generator

cd "$(dirname "$0")/../../MtdrSpring/backend"

echo "Generating PlantUML diagrams..."
echo ""

# Clean compile to ensure all classes are available
mvn clean compile

# Run the diagram generator
mvn exec:java -Dexec.mainClass="com.springboot.MyTodoList.util.PlantUMLDiagramGenerator"

echo ""
echo "Diagram generation complete! Check architecture/plantUML/ for output files."
echo ""
