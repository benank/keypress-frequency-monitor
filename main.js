const ioHook = require('iohook');
const rpc = require("./rpc.js")

console.log("Initializing...");

const RPC = new rpc();

ioHook.on('keydown', (event) => {
    HandleKey(event);
});

const MAX_KEYS_PER_ENTRY = 3;
const KEY_THRESHOLD = 6;
const KEY_PRESS_TIMEOUT = 150;

const FULLSCREEN_TIMEOUT = 2000;
const fullscreen_timeouts = 
{
    "player1": null,
    "player2": null
}

const keys = {
    "player1": {
        17: 0,
        30: 0,
        31: 0,
        32: 0
    },
    "player2": {
        38: 0,
        23: 0,
        36: 0,
        37: 0
    }
}

function HandleKey(event) {

    const player =
        keys["player1"][event.keycode] != null ? "player1" :
        keys["player2"][event.keycode] != null ? "player2" :
        null;

    if (player == null) {
        return;
    }

    // Player pressed a key
    keys[player][event.keycode]++;

    // Reset key after a short delay
    setTimeout(() => {
        keys[player][event.keycode]--;
    }, KEY_PRESS_TIMEOUT);

    // If the sum of recently pressed keys is greater than the threshold, enable fullscreen
    if (SumKeys(player) >= KEY_THRESHOLD) {
        EnableFullscreen(player);
    }

}

// Enables or refreshes fullscreen for a player
function EnableFullscreen(player)
{
    if (fullscreen_timeouts[player] == null)
    {
        // Not showing, so show it
        console.log("toggle vis!");
        RPC.toggle_player_resources(player, true);
    }

    if (fullscreen_timeouts[player] != null)
    {
        clearTimeout(fullscreen_timeouts[player]);
        fullscreen_timeouts[player] = null;
    }

    fullscreen_timeouts[player] = setTimeout(() => {
        RPC.toggle_player_resources(player, false);
        fullscreen_timeouts[player] = null;
    }, FULLSCREEN_TIMEOUT);
}

// Sums up all of the recently pressed keys for a player
function SumKeys(player) {
    let count = 0;
    for (const key in keys[player]) {
        count += Math.min(keys[player][key], MAX_KEYS_PER_ENTRY);
    }

    return count;
}

// Register and start hook
ioHook.start();