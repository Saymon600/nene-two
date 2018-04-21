const Eris = require("eris");
const fs = require("fs");
const moment = require("moment");
const request = require("request");
const env = require("./config");
const audio = require("./default-audio");

var custom = false;
var lp = [];
var queue = [];
var np = "";
var game = {
	name: ""
}

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

	    if(msg.content == "!np"){
			bot.createMessage(msg.channel.id,"I'm currently playing " + game.name);
		}

		if(msg.content == "!dj"){
			bot.createMessage(msg.channel.id,"The current dj is  " + dj);
		}

		if(msg.content == "!lp"){
			var message = '```Last played (r/a/dio):\n';
			for(var a = 0; a < lp.length; a++){
				message = message + "" + lp[a].name + ', ' + lp[a].time + "\n";
			}
			message = message + "```"
			bot.createMessage(msg.channel.id,message);
		}

		if(msg.content == "!rqueue"){
			var message = "```In queue (r/a/dio):\n";
			for(var a = 0; a < queue.length; a++){
				message = message + "" + queue[a].name + ' ' + queue[a].time + "\n";
			}
			message = message + "```"
			bot.createMessage(msg.channel.id,message);
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
	            connection.play(audio.link); 
	            bot.createMessage(msg.channel.id, "Now playing: " + audio.name);
	            connection.once("end", () => {
	                bot.createMessage(msg.channel.id, "Finished.");
	            });
			});
	    }


	}
});

bot.connect(); 

//Feeding info from r/a/dio API
setInterval(function(){
	request('http://r-a-d.io/api', function (error,response,body) {
		if(!error && response.statusCode == 200) {
			let radioJson = JSON.parse(String(body));
			let musicname = unescape(radioJson.main.np);
			dj = radioJson.main.dj.djname;

			game.name = musicname;
			np = musicname;

			for(var a = 0; a < 5; a++){
				var temp = {name: '', time: ''};
				var qtemp = {name: '', time: ''};
				temp.name = radioJson.main.lp[a].meta;
				temp.time = moment().diff(moment(parseInt(radioJson.main.lp[a].timestamp)*1000),'minutes') + " minutes ago";
				qtemp.name = radioJson.main.queue[a].meta;
				qtemp.time = "in " + moment(parseInt(radioJson.main.queue[a].timestamp)*1000).diff(moment(),'minutes') + " minutes";
				lp[a] = temp;
				queue[a] = qtemp;
			}
			if(!custom){
				bot.editStatus("",{
					name: musicname
				});
			}			
		}else{
			console.log(moment().format("LLL"),error);
		}
	});
},5000);