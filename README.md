# Live Python Benchmarking Platform

A web application that lets you write Python code and see real‑time performance comparisons between **lightweight containers** and **heavier VM‑like environments**. Built with Flask, Docker, and Chart.js.

## ✨ Features

- **Live code editor** with syntax highlighting (Ace editor)
- **Runs the same Python code** in two isolated Docker containers:
  - `python:3.9-slim` – simulates a container environment
  - `python:3.9` – heavier base, simulates VM overhead
- **Measures three key metrics**:
  - Startup time (seconds)
  - CPU usage (average %)
  - Memory usage (peak MB)
- **Visual comparison**:
  - Difference cards showing how much faster / lighter the container is
  - Three interactive bar charts (Chart.js) that update instantly
- **Clean, responsive design** with a dark‑blue background and violet/pink accents

## 🛠️ Tech Stack

- **Backend**: Python + Flask
- **Frontend**: HTML5, CSS3, JavaScript (Ace editor, Chart.js)
- **Containerization**: Docker (uses host Docker socket)
- **Database**: SQLite (optional, for saving comparisons)

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- [Docker](https://docs.docker.com/get-docker/) installed and running
- Git (optional)

### Installation

1. **Clone the repository** (or download the source):
   ```bash
   git clone https://github.com/your-username/live-benchmark.git
   cd live-benchmark