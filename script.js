const teamNameList = [
  'Basaksehir',
  'Galatasaray',
  'Besiktas',
  'Trabzonspor',
  'Yeni Malatya',
  'Konyaspor',
  'Antalyaspor',
  'Rizespor',
  'Sivasspor',
  'Kasimpasa',
  'Alanyaspor',
  'Kayserispor',
  'Fenerbahce',
  'Ankaragucu',
  'Bursaspor',
  'Goztepe',
  'Erzurumspor',
  'Akhisar'
];

let idCounter = 0;

const randomBetween = (min, max) => {
  return Math.floor(
    min + Math.floor(Math.random() * Math.floor(max + 1 - min))
  );
};

const generateID = () => {
  return idCounter++;
};

const arrayRotateOne = arr => {
  return arr.push(arr.shift());
};

const roundRobinRotate = array => {
  let newArr = arrayRotateOne(array);
  let temp = newArr[1];
  newArr[1] = newArr[0];
  newArr[0] = temp;
  return newArr;
};

//Randomize Team List
const randomizeTeamList = (
  original = teamNameList,
  swapCount = randomBetween(0, teamNameList.length)
) => {
  let randomized = [...original];
  for (let i = 0; i < swapCount; i++) {
    t1Index = randomBetween(0, teamNameList.length - 1);
    t2Index = randomBetween(0, teamNameList.length - 1);
    let temp = randomized[t1Index];
    randomized[t1Index] = randomized[t2Index];
    randomized[t2Index] = temp;
  }
  return randomized;
};

const generateTeam = teamName => {
  return {
    id: generateID(),
    teamName: teamName,
    weight: randomBetween(1, 10),
    results: {
      gamesPlayed: 0,
      won: 0,
      draw: 0,
      lose: 0,
      diff: 0,
      points: 0
    }
  };
};

const generateAllTeams = (teamList = randomizeTeamList()) => {
  const teams = [];
  for (let i = 0; i < teamList.length; i++) {
    teams.push(generateTeam(teamList[i]));
  }
  return teams;
};

const generateFixture = teams => {
  /*if (teamList.length % 2 == 1) {
    teamList.push('BYE');
     
    //  In case of there are odd number of teams, there must be a free day
    //for every team.
  } */
  let teamList = [...teams];
  let fixtureFirstHalf = [];
  let fixtureSecondHalf = [];

  //Populate the fixture array with empty matchday arrays
  for (let i = 0; i < teamList.length - 1; i++) {
    fixtureFirstHalf.push([]);
    fixtureSecondHalf.push([]);
  }

  for (let i = 0; i < teamList.length - i; i++) {
    for (let j = 0; j < teamList.length / 2; j++) {
      fixtureFirstHalf[i].push({
        team1Id: teamList[j].id,
        team2Id: teamList[teamList.length - j - 1].id,
        homescore: 0,
        awayscore: 0
      });
      fixtureSecondHalf[i].push({
        team1Id: teamList[teamList.length - j - 1].id,
        team2Id: teamList[j].id,
        homeScore: 0,
        awayScore: 0
      });
    }
    teamList = roundRobinRotate(teamList);
  }

  return fixtureFirstHalf + fixtureSecondHalf;
};

const simulateAGame = match => {
  team1Index = state.teams.findIndex(t => (t.id = match.team1Id));
  team2Index = state.teams.findIndex(t => (t.id = match.team2Id));
  const operationInterval =
    state.teams[team1Index].weight + state.teams[team2Index].weight;

  const possibilityCount = randomBetween(0, 10);
  for (let i = 0; i < possibilityCount; i++) {
    const side =
      randomBetween(0, operationInterval) > state.teams[team1Index].weight
        ? 1
        : 0;
    const luckConstant = randomBetween(0, 1);
    if (side && luckConstant == 1) {
      //home
      match.homeScore++;
    } else if (side && luckConstant == 1) {
      //away
      match.awayScore++;
    }
  }
  state.teams[team1Index].results.diff += match.homeScore - match.awayScore;
  state.teams[team2Index].results.diff += match.awayScore - match.homeScore;
  if (match.homeScore - match.awayScore > 0) {
    state.teams[team1Index].results.won += 1;
    state.teams[team2Index].results.lose += 1;
    state.teams[team1Index].results.points += 3;
  } else if (match.homeScore - match.awayScore == 0) {
    state.teams[team1Index].results.draw += 1;
    state.teams[team2Index].results.draw += 1;
    state.teams[team1Index].results.points += 1;
    state.teams[team2Index].results.points += 1;
  } else {
    state.teams[team2Index].results.won += 1;
    state.teams[team1Index].results.lose += 1;
    state.teams[team2Index].results.points += 3;
  }
  state.teams[team1Index].results.gamesPlayed += 1;
  state.teams[team2Index].results.gamesPlayed += 1;

  return match;
};

const simulateAWeek = week => {
  week.forEach(match => {
    match = simulateAGame(match);
  });
  state.standings = calculateStandings(state.teams);
  state.matchDay += 1;
  return week;
};

const simulateSeason = season => {
  season.forEach(week => {
    week = simulateAWeek(week);
  });
  return season;
};

const calculateStandings = (teams = state.teams) => {
  const table = teams.sort((t1, t2) => {
    if (t1.results.points > t2.results.points) {
      return 1; //t1 has higher points
    } else if (t1.results.points == t2.results.points) {
      if (t1.results.diff > t2.results.diff) {
        return 1; //t1 has a higher goal difference
      } else {
        return -1; //t2 has a higher goal difference
      }
    } else {
      return -1; //t2 has higher points
    }
  });
  return table.map(team => {
    return {
      teamName: team.teamName,
      results: team.results
    };
  });
};

//State
const state = {
  simulationConstants: {
    homeMultiplier: 1,
    awayMultiplier: 1,
    matchDayCount: (teamNameList.length - 1) * 2
  },
  teams: [],
  fixture: [],
  standings: [],
  matchDay: 0
};

const simulateWholeGame = () => {
  //generate Teams
  state.teams = generateAllTeams();
  //generate Fixture
  state.fixture = generateFixture(state.teams);
  state.fixture = simulateSeason(state.fixture);
  //show the standings of 34th week
  console.table(state.standings);
};

window.onload = () => simulateWholeGame();

/*
  Web sayfasina dokecek vaktim yoktu kusura bakmayin. Hic derleyip test edemeden gonderiyorum.
  Ali Emir Sen
*/
