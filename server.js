const Eris = require("eris");
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

	    if(msg.content.startsWith("!nn")){
	    	var nick = msg.content.split(" ").slice(1).join(" ");
	    	bot.editNickname(msg.channel.guild.id,nick);
	    	var status = msg.content.split(" ").slice(1).join(" ");
	    	if(msg.author.id === env.SAYMON_USER || msg.author.id === env.AUGUSTOP_USER){
	        	bot.createMessage(msg.channel.id, "殺すぞーぉ！");
	    	}else{
	    		bot.createMessage(msg.channel.id, "",{file:fs.readFileSync(__dirname + "/images/thinking.png"),name:"thinking.png"});
	    	}
	    }
	}
});

bot.connect(); 