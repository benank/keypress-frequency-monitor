const net = require("net");
const config = require("./config.js");

module.exports = class RPC
{
    constructor ()
    {
        const PIPE_NAME = "slobs";
        const PIPE_PATH = "\\\\.\\pipe\\" + PIPE_NAME;
        this.callbacks = {}
        this.ids = 1;
        this.sceneResources = {
            "player1": [],
            "player2": []
        }
        this.activeScene = null;

        this.client = net.connect(PIPE_PATH, () => {
            console.log("Connected to slobs!");

            this.send({
                "method": "getScenes",
                "params": {"resource": "ScenesService"}
            }, (data) => {
                for (let i = 0; i < data.result.length; i++)
                {
                    if (data.result[i].name == config.sceneName)
                    {
                        console.log("Found scene with name: " + config.sceneName);
                        this.sceneResourceId = data.result[i].resourceId;
                        break;
                    }
                }

                this.send({
                    "method": "getItems",
                    "params": {
                        "resource": this.sceneResourceId,
                        "args": []
                    }
                }, (data) => {
                    for (let i = 0; i < data.result.length; i++)
                    {
                        const resource = data.result[i];
                        this.find_resources_for_player(resource, "player1");
                        this.find_resources_for_player(resource, "player2");
                    }
                })
            })

            this.send({
                "method": "sceneSwitched",
                "params": {
                    "resource": "ScenesService",
                    "args": []
                }
            }, (data) => {
                console.log("scene switch data")
                console.log(data);
            })

        })
        
        this.client.on('data', (data) => {
            data = JSON.parse(data.toString());

            if (data.result == null)
            {
                return;
            }

            if (data.error)
            {
                console.log(data);
                return;
            }
            
            if (data.id != null && this.callbacks[data.id] != null)
            {
                this.callbacks[data.id](data);
            }
            else if (data.result._type == "EVENT")
            {
                this.on_event(data);
            }
        });
        
        this.client.on('end', () => {
            console.log('Client: on end');
        })
    }

    on_event (data)
    {
        if (data.result.resourceId == "ScenesService.sceneSwitched")
        {
            this.activeScene = data.result.data.name;
        }
    }

    send (data, callback)
    {
        const id = this.ids++;
        this.callbacks[id] = callback;
        data.id = id;
        data["jsonrpc"] = "2.0";
        this.client.write(JSON.stringify(data));
    }
    
    find_resources_for_player (resource, player)
    {
        for (let j = 0; j < config.sources[player].length; j++)
        {
            if (resource.name == config.sources[player][j])
            {
                console.log("Found resource: " + resource.name);
                this.sceneResources[player].push(resource.resourceId);
            }
        }
    }

    toggle_player_resources (player, enabled)
    {
        if (this.activeScene != config.sceneName)
        {
            return;
        }

        for (let i = 0; i < this.sceneResources[player].length; i++)
        {
            this.send({
                "method": "setVisibility",
                "params": {
                    "resource": this.sceneResources[player][i],
                    "args": [enabled]
                }
            })
        }
    }
}