const Eris = require("eris");
const fs = require("fs");
const env = require("./config")

var bot = new Eris(env.TOKEN);

bot.on("ready", () => { 
    console.log("お兄ちゃん、行くぞ！"); 
});

bot.on("messageCreate", (msg) => {
	//I guess, a Nene não precisa de uma estrutura robusta (espero)
	if(msg.channel.id === env.GAMEBOARD_CHANNEL || msg.author.id === env.SAYMON_USER){

		//Ping 
		if(msg.content.startsWith("!ping")){ 
	        bot.createMessage(msg.channel.id, "Pong!");
	    }

	    //Change nick
	    if(msg.content.startsWith("!nn")){
	    	if(msg.content.length <= 4) { 
	            bot.createMessage(msg.channel.id, "Please enter name.",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	            return;
			}
	    	var nick = msg.content.split(" ").slice(1).join(" ");
	    	bot.editNickname(msg.channel.guild.id,nick);
	    	var status = msg.content.split(" ").slice(1).join(" ");
	    	if(msg.author.id === env.SAYMON_USER || msg.author.id === env.AUGUSTOP_USER){
	        	bot.createMessage(msg.channel.id, "殺すぞーぉ！");
	    	}else{
	    		bot.createMessage(msg.channel.id, "",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	    	}
	    }

	    //Connect to the Voice Channel and plays r/a/dio
	    if(msg.content.startsWith("!connect")){
	    	if(!msg.channel.guild) { 
	    		bot.createMessage(msg.channel.id, "You need to be in a server to run this command.",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	    		return;
			}
			if(!msg.member.voiceState.channelID) { 
	            bot.createMessage(msg.channel.id, "You need to be in a voice channel to run this command.",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	            return;
			}

			//Connecting
			bot.joinVoiceChannel(msg.member.voiceState.channelID).catch((err) => { 
	            bot.createMessage(msg.channel.id, "Error joining voice channel: " + err.message); 
	            console.log(err); 
			}).then((connection) => {
	            if(connection.playing){ 
	                connection.stopPlaying();
	            }
	            connection.play("music/masterpiece.mp3"); 
	            bot.createMessage(msg.channel.id, "Now playing: M@sterpiece");
	            connection.once("end", () => {
	                bot.createMessage(msg.channel.id, "Finished.");
	            });
			});
	    }


	}
});

bot.connect(); 