# Door System Calculator

This repository contains a simple calculator for seven types of door systems.
It is implemented as a single HTML file without external dependencies.

## Running

1. From this directory run a minimal web server, for example using Python 3:

   ```bash
   python3 -m http.server
   ```

2. Open your browser at [http://localhost:8000/index.html](http://localhost:8000/index.html)
   (or the port shown in the terminal if different).

## Checking functionality

- Choose a door system from the main menu.
- Enter the required dimensions.
- If "Рифленое" glass is selected, some shottlan options become hidden.
- Subsystem options update automatically depending on the entered width.
- Click **Рассчитать** to display the result table with the calculated cost.

All fields are required. If no subsystems match the provided width, you
will see a corresponding message instead of the dropdown options.
