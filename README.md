# GradPath

A program that automatically generates and visualizes university graduation plans using a unique graph structure.

## How it works

Data is retrieved or downloaded from university servers. Then, the data is processed and converted into custom Python objects.
These Python objects are then ingested by a program that generates a graph structure using networkx and visualizes it using matplotlib.

## Features

- Visualization of course prerequisites and dependencies
- Interactive course selection
- Course completion tracking (click on a course to mark it as completed)
- Semester-based course organization
- Responsive layout with dark mode support

## How to run

### Prerequisites

Python installed on your system

### Run commands

```bash
init.sh
source .venv/bin/activate

# to see fully made diagram
python complete_diagram.py

# to build your own diagram
python build_your_own.py
```
