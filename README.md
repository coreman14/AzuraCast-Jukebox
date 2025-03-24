### To-do List
- [ ] Redesign UI. I went for "It works" rather than "Its complete"
- [ ] Fix errors relating to channel switching (It gets an abort error when switching channels too fast.)
- [ ] Add better now playing info (Like album, ability to look at next song)
- [ ] Investigate /api/nowplaying to see if we could replace the station api call with it instead
- [ ] Add now playing to all the buttons, so that we know what is playing on every channel
- [ ] Investigate if adding a hover queue to each button is a good idea
- [ ] A force toggle for showing/hiding the server URL input
- [ ] Overhaul radio connection logic, make sure that it connects and disconnect when needed (Such as when the server url is changed.)
- [ ] Add AzuraCast plugin. (I tried. I keep getting errors. Not a php dev)

### AzuraCast Jukebox
A React SPA that connects to an AzuraCast instance and allows for simple swapping between different channels. This web app acts similar to a car radio or an old jukebox, allowing for channel switching and controlling the volume.

## Versions Difference
~~There are 2 versions of this app available in release, a Standlone HTML file and a AzuraCast plugin. If you add the plugin to the AzuraCast instance, this page will be served on `/jukebox` and can be accessed anywhere. If you use the standalone version, you must manually enter the server address.~~

Currently, only the standalone version is available, as I'm having trouble getting the AzuraCast plugin to work.


## Troubleshooting
At the moment, the app will try to recognize whether this app is being served from an AzuraCast plugin or is being used as a standalone file. When the file is first open, it attempts to ping the `/api/nowplaying` endpoint. If this request fails, it will assume it is being used in standalone mode and will display the server address bar. If the request succeeds, it will hide the server address bar, assuming it is being served from the plugin.

If this process ever goes wrong, and you find yourself change the server address, open your dev tools and navigate to "Application" → "Local storage" and change the variable "servedfromserver" to "True" or "False" depending on your situation. "True" will disable the input, while false will show it.


