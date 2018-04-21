const Eris = require("eris");
const env = require("./config")

var bot = new Eris(env.TOKEN);

bot.on("ready", () => { 
    console.log("お兄ちゃん、行くぞ！"); 
});

bot.on("messageCreate", (msg) => {
	if(msg.channel.id === env.GAMEBOARD_CHANNEL || msg.author.id === env.SAYMON_USER){
		if(msg.content === "!ping") { 
	        bot.createMessage(msg.channel.id, "Pong!");
	    } else if(msg.content === "!pong") { 
	        bot.createMessage(msg.channel.id, "Ping!");
	    }
	}
});

bot.connect(); 