# tferDocker

## Building the app
Firstly clone the repo
```
git clone https://github.com/jmcurran/tferDocker.git
```
Change into the ```tferDocker``` directory and build the image
```
cd tferDocker
docker build -t tfer .
```

## Running the app
Type the following into a terminal
```
docker run --rm -p 3838:3838 tfer 
```
then put the following into your favourite browser's address bar
```
127.0.0.1:3838
```

## Terminating the app
You can do this by typing ```Ctrl-C``` into the terminal you ran the app from, or you can use
```
docker ps
```
to find the ```ContainerID``` of the runnning app and typing 
```
docker kill <ContainerID>
```
into a terminal window.
