var game = {
	Gold: 150,
	Weapons: 0,
}
var prevts = 0;//not used yet

var malus = {
	gold:0,//Gold Per Second Malus
	weapons:0,//Weapons Per Second Malus
}
var display = {

	updateScore: function() {
		document.getElementById("GoldNumber").innerHTML = expOrFix(game.Gold);
		document.getElementById("GoldPerSecond").innerHTML = expOrFix(getSPS("Gold"));	
		document.getElementById("WeaponNumber").innerHTML = expOrFix(game.Weapons);
		document.getElementById("WeaponsPerSecond").innerHTML = expOrFix(getSPS("Weapons"));		
	},

	updateShop: function() {
		document.getElementById("buildsContainer").innerHTML='';
		for (i=0;i<Buildings.name.length;i++) {
			document.getElementById("buildsContainer").innerHTML+='<div class="ShopButton '+Buildings.prodType[i]+' unselectable"><table><td id="name"><p class="name">'+Buildings.name[i]+' : </p></td><td><span class="count">'+Buildings.Number[i]+'</span></td></tr><tr><tr></tr><tr><td><ul><li><button onclick="Buildings.buy('+i+',1)">+1</button>Cost: <span>'+expOrFix(Buildings.buildingCost(i,1))+'</span></li><li><button onclick="Buildings.buy('+i+',10)">+10</button>Cost: <span>'+expOrFix(Buildings.buildingCost(i,10))+'</span></li><li><button onclick="Buildings.buy('+i+',50)">+50</button>Cost: <span>'+expOrFix(Buildings.buildingCost(i,50))+'</span></li></td></tr></table><div>';
		}
	},
	updateCountries: function() {
		document.getElementById("EnemiesList").innerHTML="";
		for (i=0;i<Enemies.name.length;i++)/*check the entire Array "Enemies"*/ {
			if (Enemies.setMilitaryPower(i) <= game.Weapons && Enemies.status[i] != "Defeated" ) {
				Enemies.status[i] = "Defeatable";
				document.getElementById("EnemiesList").innerHTML+='<li class="defeatable unselectable"> <p>'+Enemies.name[i]+' </p><button onclick="Enemies.invade('+i+')"><img src="assets/Nuclear.png"><span>'+expOrFix(Enemies.setMilitaryPower(i))+'</span></button></li>';
			}//create a button if the player has enough Weapons to beat this country
			else {
				document.getElementById("EnemiesList").innerHTML+='<li class="upgradeButton '+Enemies.status[i]+' unselectable"> <p>'+Enemies.name[i]+'<span> '+expOrFix(Enemies.setMilitaryPower(i))+'</span></p></li>';
			}
		}
	},
	updateUpgrades : function() {
		document.getElementById("upgradesContainer").innerHTML='';
		for(i=0;i<Upgrades.name.length;i++) {
			if (Upgrades.type[i]=="buyable" || Upgrades.number[i]<1) {
			document.getElementById("upgradesContainer").innerHTML+='<div class="'+Upgrades.type[i]+' '+Buildings.prodType[Upgrades.effectOn[i]]+' unselectable"><table><tr><td class="name"><p>'+Upgrades.name[i]+': </p></td><td class="count"> '+Upgrades.number[i]+'</td></tr><tr><td><button onclick="Upgrades.buy('+i+')">Buy this '+Upgrades.type[i]+'</button></td><td> Cost:'+Upgrades.costCalc[i](Upgrades.number[i])+'</td><td>'+Upgrades.costType[i]+'</td></tr><tr><td> '+Upgrades.description[i]+'</td></tr></table></div>';
			}
		}
	}
};

window.onload = function() {
	loadGame();
	display.updateUpgrades();
	display.updateScore();
	display.updateShop();
	display.updateCountries();
};

function addGold() {
	game.Gold++;
	display.updateScore();
}//called everytimes the user click on the page

var Buildings = {
	prodType:["Gold","Weapons"],//Gold or Weapons
	Number: [0,0],
	name: ["GoldMines","WeaponsAssembly"],
	image:["",""],//write a fold path
	baseCost: [10,100],//in Gold
	costScaling: [1.05,1.10],
	baseProd: [1,1],//increased by upgrades

	buildingCost: function (index,Amount) {
			var buildCost = Math.pow(this.costScaling[index],this.Number[index])*this.baseCost[index];
			buildCost = buildCost*Amount;
			return buildCost;
		},

	buy: function (index,Amount) {

		if (game.Gold >= this.buildingCost(index,Amount)) {
			game.Gold-= this.buildingCost(index,Amount);
			this.Number[index] = this.Number[index]-0+Amount;//make sure that this.number is a number and not a string
			if (this.prodType[index] == "Weapons") {
				malus.gold += 1;
			}
		}
		display.updateScore();
		display.updateShop();
	}
};

var Upgrades = {
	name:["increase Gold Mines' production","upgrade Weapon Assemblies' production"],
	costCalc:[function(numb) {return Math.pow(numb+1,2)*10;},
	function(numb) {return (numb+1)*10;}],
	costType:["Gold","GPS"],//GoldperSecond, Gold,Weapons etc 
	effectCalc:[function(numb) {return Math.sqrt(numb+1)},
	function(numb) {return expOrFix(Math.pow(Math.log(numb+1),1.5))}],
	effectOn:[0,1],//0 = Buildings.baseprod[0] = Goldmines
	number:[0,0],
	type:["buyable", "upgrade"],//buyable or upgrade
	status:[],
	description:["this is a description","this is a description too"],

	buy: function(index) {

		if (this.costType[index] == "Gold") {
			if (game.Gold >= this.costCalc[index](this.number[index])) {
				game.Gold-= this.costCalc[index](this.number[index]);
				this.number[index]++;
				this.applyEffect(index);
			}
		}
		if (this.costType[index] == "Weapons") {
			if (game.Weapons >= this.costCalc[index](this.number[index])) {
				game.Weapons -= this.costCalc[index](this.number[index]);
				this.number[index]++;
				this.applyEffect(index);
			}
		}
		if (this.costType[index] == "GPS") {
			if (getSPS("Gold") >= this.costCalc[index](this.number[index])) {
				malus.gold += this.costCalc[index](this.number[index]);
				this.number[index]++;
				this.applyEffect(index);
			}
		}
	},
	applyEffect: function(index) {
		Buildings.baseProd[this.effectOn[index]] = this.effectCalc[index](this.number[index]+1);
		display.updateScore();
		display.updateUpgrades();
	},
}

var Enemies = {
	name:["China","Russia","USA"],
	status:[],
	militaryPower:[],
	
	setMilitaryPower: function(index) {
		this.militaryPower[index] = Math.pow(1.10,index)*10;
			return this.militaryPower[index];
	},

	invade: function(index) {
		this.status[index] = "Defeated";
	}
};

function addMalus(Amount, malusType) {
	if(malusType == "Gold") {
		malus.gold += Amount;
	}
	if(malusType == "Weapons") {
		malus.weapons += Amount;
	}
}

function getSPS(prodType) {
	var prodPerSecond = 0;
		for (i=0;i<Buildings.name.length;i++) {
			if (Buildings.prodType[i] == prodType){
				prodPerSecond += Buildings.baseProd[i] * Buildings.Number[i];
			}
		}
		if (prodType == "Gold") {
			return prodPerSecond -= malus.gold;
		}
		if (prodType == "Weapons") {
			return prodPerSecond -= malus.weapons;
		}
	}

function expOrFix(number) {
	if (number >= 1e6) {
		return readableData=number.toExponential(1);
	} 
	else { 
		return readableData=number.toFixed(1);
	}
	
}

setInterval (function() {
	console.log(malus.gold);
	game.Gold += getSPS("Gold");
	game.Weapons += getSPS("Weapons")
	display.updateScore();
	display.updateCountries();
}, 1000)

/*function nextFrame(ts) {
	let dt = ts - prevts;
	prevts = ts;
	simulateTime(dt);
	requestAnimationFrame(nextFrame);
}

function simulateTime(mt) {
	let t = mt / 1000;
	game.Gold += GoldMines.baseProd * t * game.MineNumber;
	updateDisplay();
	requestAnimationFrame(nextFrame);
}*/

function saveGame() {
	var gameSave = {
		gold: game.Gold,
		weapons: game.Weapons,
		buildingNumber: Buildings.Number,
		enemiesStatus: Enemies.status,
		malusGold:malus.gold,
		malusWeapons:malus.weapons,
		upgradeNumber: Upgrades.number,
	};
	localStorage.setItem("gameSave", JSON.stringify(gameSave));
}

function loadGame() {
	var savedGame = JSON.parse(localStorage.getItem("gameSave"));
	if (localStorage.getItem("gameSave")!== null) {
		if (typeof savedGame.gold !== "undefined") game.Gold = savedGame.gold;
		if (typeof savedGame.weapons !== "undefined") game.Weapons = savedGame.weapons;
		if (typeof savedGame.malusWeapons !== "undefined") malus.weapons = savedGame.malusWeapons;
		if (typeof savedGame.malusGold !== "undefined") malus.gold = savedGame.malusGold;
		
		if (typeof savedGame.buildingNumber !== "undefined") {
			for (i=0;i<savedGame.buildingNumber.length; i++) {
				Buildings.Number[i] = savedGame.buildingNumber[i];
			}
		}
		if (typeof savedGame.enemiesStatus !== "undefined") {
			for (i=0;i<savedGame.enemiesStatus.length; i++) {
				Enemies.status[i] = savedGame.enemiesStatus[i];
			}
		}
		if (typeof savedGame.upgradeNumber !== "undefined") {
			for (i=0;i<savedGame.upgradeNumber.length; i++) {
				Upgrades.number[i] = savedGame.upgradeNumber[i];
			}
		}
	}
}

setInterval (function () {
	saveGame();
}, 30000)

document.addEventListener("keydown", function(event) {
	if (event.ctrlKey && event.which == 83) {
		saveGame();
	}
}, false);

function resetGame () {
	if (confirm("Are you SURE you want to reset your Game ?")) {
		var gameSave = {};
		localStorage.setItem("gameSave", JSON.stringify(gameSave));
		location.reload();
	}
}

const menuBtn = document.querySelectorAll('.container-btn');
let menuOpen = true;
menuBtn.forEach(function(Btn) {
	Btn.classList.add('open');
	Btn.addEventListener('click', () => {
		if(!menuOpen) {
			Btn.classList.add('open');
			menuOpen=true;
		}
		else {
			Btn.classList.remove('open');
			menuOpen=false;
		}
	})
});
