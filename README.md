# Daily Streakers Tracker

A website to track daily streakers (thx) from a specified list

## Prerequisites

Install [Git](https://git-scm.com/downloads) and [Nodejs](https://nodejs.org/en/download) (v22 LTS)

### Installation Notes
- **Windows:** The easiest way to run Nodejs on Windows is by downloading the "Windows Installer". Scroll down to see that option. 
- **macOS/Linux:** nvm is recommended.
- **AIX:** Standalone binary is recommended since that's the only option when this was written.

## Getting started
0. Open the terminal
1. Clone this repo:<br>
`git clone https://gitlab.com/thekrowned/website.git`
2. Go to the newly created folder:<br>
`cd website`
3. Install the dependencies:<br>
`npm i`
4. Copy the **".env.sample"** file to **".env"**, then follow the instructions to fill in the empty variables
5. Build the app:<br>
`npm run build`
6. Initialise the database table:<br>
`npm run db:init`
7. Run the app:<br>
`npm run start`