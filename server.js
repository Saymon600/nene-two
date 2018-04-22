const Eris = require("eris");
const fs = require("fs");
const moment = require("moment");
const request = require("request");
const ytdl = require("ytdl-core");


const env = require("./config");
const audio = require("./default-audio");

//Custom controls
var custom = false;
var playing = false;
var cqueue = [];

//R/a/dio objs
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
			bot.createMessage(msg.channel.id,"The current dj is " + dj);
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

		if(msg.content == "!queue"){
			if(custom){
				var message = "```In queue:\n";
				for(var a = 0; a < cqueue.length; a++){
					message = message + "" + cqueue[a].name + ' . Requested by ' + cqueue[a].user + "\n";
				}
				message = message + "```"
			}else{
				var message = "```In queue (r/a/dio):\n";
				for(var a = 0; a < queue.length; a++){
					message = message + "" + queue[a].name + ' ' + queue[a].time + "\n";
				}
				message = message + "```"
			}
			bot.createMessage(msg.channel.id,message);
		}

		if(msg.content == "!nhelp"){
			message = "Command List:\n";
			message += "!play (+ direct mp3 link[pomf and stuff] or YouTube link): I'1ll play it for you or queue it.\n";
			message += "!queue: shows custom queue list or r/a/dio's one.\n";
			message += "!connect: connect to r/a/dio\n";
			message += "!leave: I'll leave the voice channel if you're with me there.\n";
			message += "!ping: pon\n";
			message += "!nn (+ something): changes my nick\n";
			message += "!np: shows what is playing in r/a/dio right now\n";
			message += "!dj: show who's playing in r/a/dio right now\n";
			message += "!lp: shows last played songs in r/a/dio\n";
			message += "!rqueue: show r/a/dio queue list\n";
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
			playAudio(audio.link,audio.name,msg.member.voiceState.channelID,msg);
	    }

	    if(msg.content.startsWith("!leave")){
	    	bot.leaveVoiceChannel(msg.member.voiceState.channelID);
	    }

	    //Connect to the Voice Channel and plays custom source
	    if(msg.content.startsWith("!play")){
	    	if(!msg.channel.guild) { 
	    		bot.createMessage(msg.channel.id, "You need to be in a server to run this command.",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	    		return;
			}
			if(!msg.member.voiceState.channelID) { 
	            bot.createMessage(msg.channel.id, "You need to be in a voice channel to run this command.",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	            return;
			}

			//Pre-processing
			var music = msg.content.split(" ").slice(1).join(" ");
			
			//mp3
			if(music.startsWith("http") && music.endsWith(".mp3")){
				let split = music.split("/");
				let tempName = split[split.length-1];

				var r = request(music);
				r.on("response",function(res){
					res.pipe(fs.createWriteStream("music/" + tempName));
					if(playing && custom){
						let newAudio = initCustom();
						newAudio.name = tempName;
						newAudio.link = "music/" + tempName;
						newAudio.channel = msg.member.voiceState.channelID;
						newAudio.user = msg.author.username;
						cqueue.push(newAudio);
						bot.createMessage(msg.channel.id,tempName + " queued.");
					}else{
						custom = true;
						playAudio("music/" + tempName,tempName,msg.member.voiceState.channelID,msg);
					}
				});
			}else if(music.indexOf("youtube") > -1){
				//YouTube
				ytdl.getInfo(music,(err,info) => {
					if(err){
						bot.createMessage(msg.channel.id,"Something went wrong: " + err);
						return;
					}
					let tempName = info.title;
					let ytid = info.vid;
					stream = ytdl(music,{filter:"audioonly"});
					if(playing && custom){
						let newAudio = initCustom();
						newAudio.name = tempName;
						newAudio.link = stream;
						newAudio.channel = msg.member.voiceState.channelID;
						newAudio.user = msg.author.username;
						cqueue.push(newAudio);
						bot.createMessage(msg.channel.id,tempName + " queued.");
					}else{
						custom = true;
						playAudio(stream,tempName,msg.member.voiceState.channelID,msg);
					}
				});
			}else{
				bot.createMessage(msg.channel.id,"Probably it's an invalid link. Please check and try again.");
				return;
			}
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

			if(!custom){
				game.name = musicname;
				np = musicname;
				bot.editStatus("",{
					name: musicname
				});
			}
			

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
		}else{
			console.log(moment().format("LLL"),error);
		}
	});
},5000);

var initCustom = function(){
	return {
		link: "",
		name: "",
		channel: "",
		user: ""
	};
}

var playAudio = function(link,name,channel,msg){
	console.log("Playing: " + name);
	bot.joinVoiceChannel(channel).catch((err) => { 
        //bot.createMessage(msg.channel.id, "Error joining voice channel: " + err.message); 
        console.log(err); 
	}).then((connection) => {
        if(connection.playing && !custom){ 
            connection.stopPlaying();
        }
        playing = true;
        connection.play(link);
        bot.createMessage(msg.channel.id, "Now playing: " + name);
        bot.editStatus("",{
			name: name
		});
        connection.once("end", () => {
        	playing = false;
        	if(cqueue.length > 0){
        		custom = true;
        		let next = cqueue[0];
        		cqueue.splice(0,1);
        		playAudio(next.link,next.name,next.channel,msg);
        	}else{
        		custom = false;
        		bot.createMessage(msg.channel.id, "Finished.");
        		playAudio(audio.link,audio.name,channel,msg);
        	}
            
        });
	});
}

