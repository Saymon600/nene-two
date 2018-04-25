const express = require('express');
const app = express();
const port = process.env.PORT || 3030;
const Eris = require("eris");
const fs = require("fs");
const moment = require("moment");
const request = require("request");
const ytdl = require("ytdl-core");


const constants = require("./discordConstants");
const audio = require("./default-audio");

const commands = [];

//Custom controls
let custom = false;
let playing = false;
let cqueue = [];

//R/a/dio objs
let lp = [];
let queue = [];
let np = "";
let game = {
	name: ""
}

const bot = new Eris(process.env.TOKEN);

app.listen(port, () => {
	console.log(moment().format("LLL") + ': Clarion is running on port ' + port);
});

bot.connect(); 

bot.on("ready", () => { 
		console.log("お兄ちゃん、行くぞ！");
		createCommands();
});

const createCommands = () => {

	//Ping
	commands.push({
		condition: (msg) => { return msg.content.startsWith("!ping") },
		executeAction: (msg) => { bot.createMessage(msg.channel.id, "Pong!"); },
	});

	//Change Nick
	commands.push({
		condition: (msg) => { return msg.content.startsWith("!nn") },
		executeAction: (msg) => { changeNick(msg) },
	});

	//Change NP
	commands.push({
		condition: (msg) => { return msg.content.startsWith("!changeNP") },
		executeAction: (msg) => { changeNP(msg) },
	});

	//Show Now Playing
	commands.push({
		condition: (msg) => { return msg.content === "!np" },
		executeAction: (msg) => { bot.createMessage(msg.channel.id,"I'm currently playing " + game.name); },
	});

	//Show Current DJ from R/a/dio
	commands.push({
		condition: (msg) => { return msg.content === "!dj" },
		executeAction: (msg) => { bot.createMessage(msg.channel.id,"The current dj is " + dj); },
	});

	//Show Last Played
	commands.push({
		condition: (msg) => { return msg.content === "!lp" },
		executeAction: (msg) => { showGenericQuery(msg, "```Last played (r/a/dio):\n", lp) },
	});

	//Show Queue From R/a/dio
	commands.push({
		condition: (msg) => { return msg.content === "!rqueue" },
		executeAction: (msg) => { showGenericQuery(msg, "```In queue (r/a/dio):\n", queue) },
	});

	//Show Current Queue
	commands.push({
		condition: (msg) => { return msg.content === "!queue" },
		executeAction: (msg) => { return ((custom) ? showGenericQuery(msg, "```In custom queue:\n", cqueue) : commands[commands.length - 1].executeAction(msg) )},
	});

	//Show Help
	commands.push({
		condition: (msg) => { return msg.content === "!help" },
		executeAction: (msg) => { showHelp(msg) },
	});

	//Connect to the Voice Channel and plays r/a/dio
	commands.push({
		condition: (msg) => { return msg.content === "!connect" },
		executeAction: (msg) => { joinVoiceChannel(msg, false) },
	});

	//Exit Voice Channel
	//There is a bug with this little shit: when the bots restarts while in a voice channel, the command doesn't work
	commands.push({
		condition: (msg) => { return msg.content.startsWith("!leave")},
		executeAction: (msg) => { bot.leaveVoiceChannel(msg.member.voiceState.channelID) },
	});

	//Connect to the Voice Channel and plays custom source
	commands.push({
		condition: (msg) => { return msg.content.startsWith("!play") },
		executeAction: (msg) => { joinVoiceChannel(msg, true) },
	});
};

const sendThinking = (channelId, feedback) => {
	bot.createMessage(channelId, feedback, {file:fs.readFileSync(__dirname + "/images/thinking.png"), name:"thinking.png"});
};

const changeNick = () => {
	if(msg.content.length <= 4 || !(msg.author.id === constants.SAYMON_USER || msg.author.id === constants.AUGUSTOP_USER)) { 
		return sendThinking(msg.channel.id, (msg.content.length <= 4) ? 'Please enter name.' : 'No.');
	}
	var nick = msg.content.split(" ").slice(1).join(" ");
	bot.editNickname(msg.channel.guild.id, nick);
	bot.createMessage(msg.channel.id, "殺すぞーぉ！");
	//const status = msg.content.split(" ").slice(1).join(" ");
};

const changeNP = (msg) => {
	if(!(msg.author.id === constants.SAYMON_USER || msg.author.id === constants.AUGUSTOP_USER)) { 
		return sendThinking(msg.channel.id, 'No.');
	}
	const np = msg.content.split(" ").slice(1).join(" ");
	bot.editStatus("", {name: np});
	bot.createMessage(msg.channel.id, "殺すぞーぉ！");
	//const status = msg.content.split(" ").slice(1).join(" ");
};

const showGenericQuery = (msg, feedback, genericQuery) => {
	genericQuery.forEach((e) => {
		feedback += `${e.name}, ${e.time}\n`;
	});
	feedback += '```';
	bot.createMessage(msg.channel.id, feedback);
};

const showHelp = (msg) => {
	message = "```Command List:\n";
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

	message+= "```"
	bot.createMessage(msg.channel.id,message);
};

const joinVoiceChannel = (msg, custom) => {
	if(!(msg.member.voiceState.channelID || msg.channel.guild)) { 
		return sendThinking(msg.channel.id, (!msg.channel.guild) ? "You need to be in a server to run this command." :  "You need to be in a voice channel to run this command.");
	}

	if (!custom) {
		return playAudio(audio.link, audio.name, msg.member.voiceState.channelID, msg);
	}
	const music = msg.content.split(" ").slice(1).join(" ");

	if (music.startsWith("http") && music.endsWith(".mp3")) {
		return checkMP3(msg);
	} 

	if(music.indexOf("youtube") > -1){
		return checkYoutube(msg, music);
	}
	bot.createMessage(msg.channel.id,"Probably it's an invalid link. Please check and try again.");
};

const checkMP3 = (msg) => {
	let split = music.split("/");
	let tempName = split[split.length-1];

	var r = request(music);
	r.on("response", (res) => {
		const link = "music/" + tempName;
		res.pipe(fs.createWriteStream(link));
		prepareCustom(msg, tempName, link);
	});
};

const checkYoutube = (msg, music) => {
	console.log('aa')
	ytdl.getInfo(music, (err, info) => {
		console.log('bb')
		if(err){
			return bot.createMessage(msg.channel.id,"Something went wrong: " + err);
		}
		let tempName = info.title;
		let ytid = info.vid;
		stream = ytdl(music, { filter:"audioonly" } );
		prepareCustom (msg, info.title, stream);
	});
};

const prepareCustom = (msg, tempName, link) => {
	if (playing && custom) {
		cqueue.push({
			name: tempName,
			link: link,
			channel: msg.member.voiceState.channelID,
			user: msg.author.username
		});
		bot.createMessage(msg.channel.id, tempName + " queued.");
		return;
	}
	custom = true;
	playAudio(link, tempName, msg.member.voiceState.channelID, msg);
};

const checkCommand = (command) => {
	if (command.condition(...command.args)) {
		command.executeAction(...command.args);
		return true;
	}
	return false;
};

bot.on("messageCreate", (msg) => {
	//I guess, a Nene não precisa de uma estrutura robusta (espero)
	/////Please. Being autist is fun
	
	if (!(msg.channel.id === constants.GAMEBOARD_CHANNEL || msg.author.id === constants.SAYMON_USER || msg.author.id === constants.AUGUSTOP_USER)){
		return;
	}

	for (let c of commands) {
		c.args = [msg];
		if (checkCommand(c)) {
			return;
		}
	}
});


const radioMetaUpdate = setInterval(() => {
	request("http://r-a-d.io/api", (err, res, body) => {
		if(err || res.statusCode !== 200){
			console.log(moment().format("LLL"),err);
			return;
		}
		const radioJson = JSON.parse(String(body));
		const musicName = unescape(radioJson.main.np);
		dj = radioJson.main.dj.djname;
		if (!custom) {
			if (game.name !== musicName) {
				game.name = musicName;
				console.log('Trocou');
				np = musicName;
				bot.editStatus("online", {name: musicName});
			}
		}
		for(let a = 0; a < 5; a++){
			const temp = {};
			const qtemp = {};
			temp.name = radioJson.main.lp[a].meta;
			temp.time = moment().diff(moment(parseInt(radioJson.main.lp[a].timestamp)*1000),'minutes') + " minutes ago";
			qtemp.name = radioJson.main.queue[a].meta;
			qtemp.time = "in " + moment(parseInt(radioJson.main.queue[a].timestamp)*1000).diff(moment(),'minutes') + " minutes";
			lp[a] = temp;
			queue[a] = qtemp;
		}
	});
}, 10000);

const playAudio = async (link, name, channel, msg) => {
	console.log("Playing: " + name);
	try {
		const connection = await bot.joinVoiceChannel(channel);
		if (connection.playing && !custom) {
			connection.stopPlaying();
		}
		playing = true;
		connection.play(link);
		bot.createMessage(msg.channel.id, "Now playing: " + name);
		bot.editStatus("online", {name: name});
		connection.once("end", () => { checkConnectionEnd(channel, msg) });
	} catch (err) {
		console.log(err);
	}
};

const checkConnectionEnd = (channel, msg) => {
	playing = false;
	if (cqueue.length > 0) {
		custom = true;
		const next = cqueue[0];
		cqueue.splice(0, 1);
		playAudio(next.link, next.name, next.channel, msg);
		return;
	}
	custom = false;
	bot.createMessage(msg.channel.id, "Finished.");
	//playAudio(audio.link, audio.name, channel, msg);
};
