//FIRST AND FOLLOW SET FUNCTIONS
function buildFirstSets(grammar) {
  firstSets = {};
  buildSet(firstOf);
}

function firstOf(symbol) {

  if (firstSets[symbol]) {
    return firstSets[symbol];
  }

  var first = firstSets[symbol] = {};

  if (isTerminal(symbol)) {
    first[symbol] = true;
    return firstSets[symbol];
  }

  var productionsForSymbol = getProductionsForSymbol(symbol);
  for (var k in productionsForSymbol) {
    var production = getRHS(productionsForSymbol[k]);

    for (var i = 0; i < production.length; i++) {
      var productionSymbol = production[i];

      if (productionSymbol === EPSILON) {
        first[EPSILON] = true;
        break;
      }

      var firstOfNonTerminal = firstOf(productionSymbol);


      if (!firstOfNonTerminal[EPSILON]) {
        merge(first, firstOfNonTerminal);
        break;
      }

      merge(first, firstOfNonTerminal, [EPSILON]);
      
    }
  }

  return first;
}


function getProductionsForSymbol(symbol) {
  var productionsForSymbol = {};
  for (var k in grammar) {
    if (grammar[k][0] === symbol) {
      productionsForSymbol[k] = grammar[k];
    }
  }
  return productionsForSymbol;
}


function getLHS(production) {
  return production.split('->')[0].replace(/\s+/g, '');
}

function getRHS(production) {
  return production.split('->')[1].replace(/\s+/g, '');
}

function buildFollowSets(grammar) {
  followSets = {};
  buildSet(followOf);
}

function followOf(symbol) {

  if (followSets[symbol]) {
    return followSets[symbol];
  }

  var follow = followSets[symbol] = {};

  if (symbol === START_SYMBOL) {
    follow['$'] = true;
  }


  var productionsWithSymbol = getProductionsWithSymbol(symbol);
  for (var k in productionsWithSymbol) {
    var production = productionsWithSymbol[k];
    var RHS = getRHS(production);

    
    var symbolIndex = RHS.indexOf(symbol);
    var followIndex = symbolIndex + 1;


    while (true) {

      if (followIndex === RHS.length) { 
        var LHS = getLHS(production);
        if (LHS !== symbol) { 
          merge(follow, followOf(LHS));
        }
        break;
      }

      var followSymbol = RHS[followIndex];

      var firstOfFollow = firstOf(followSymbol);

      
      if (!firstOfFollow[EPSILON]) {
        merge(follow, firstOfFollow);
        break;
      }

      merge(follow, firstOfFollow, [EPSILON]);
      followIndex++;
    }
  }

  return follow;
}

function buildSet(builder) {
  for (var k in grammar) {
    builder(grammar[k][0]);
  }
}

function getProductionsWithSymbol(symbol) {
  var productionsWithSymbol = {};
  for (var k in grammar) {
    var production = grammar[k];
    var RHS = getRHS(production);
    if (RHS.indexOf(symbol) !== -1) {
      productionsWithSymbol[k] = production;
    }
  }
  return productionsWithSymbol;
}

function isTerminal(symbol) {
  return !/[A-Z]/.test(symbol);
}

function merge(to, from, exclude) {
  exclude || (exclude = []);
  for (var k in from) {
    if (exclude.indexOf(k) === -1) {
      to[k] = from[k];
    }
  }
}

function printGrammar(grammar) {
  console.log('Grammar:\n');
  for (var k in grammar) {
    console.log('  ', grammar[k]);
  }
  console.log('');
}

function printSet(name, set) {
  console.log(name + ': \n');
  for (var k in set) {
    console.log('  ', k, ':', Object.keys(set[k]));
  }
  console.log('');
}

function formatFirstSets(set){
  for (var k in set) {
    formatedFirstSets[k]=Object.keys(set[k]);
  }
}

function formatFollowSets(set){
  for (var k in set) {
    formatedFollowSets[k]=Object.keys(set[k]);
  }
}

//PARSING TABLE FUNCTIONS
function buildParsingTable(grammar) {
  var parsingTable = {};

  for (var k in grammar) {
    var production = grammar[k];
    var LHS = getLHS(production);
    var RHS = getRHS(production);
    var productionNumber = Number(k);

    if (!parsingTable[LHS]) {
      parsingTable[LHS] = {};
    }
    if (RHS !== EPSILON) {
      getFirstSetOfRHS(RHS).forEach(function(terminal) {
        parsingTable[LHS][terminal] = productionNumber;
      });
    } else {
      formatedFollowSets[LHS].forEach(function(terminal) {
        parsingTable[LHS][terminal] = productionNumber;
      });
    }
  }

  return parsingTable;
}

function getFirstSetOfRHS(RHS) {
  return formatedFirstSets[RHS[0]];
}

//PARSING FUNCTIONS
function parse(source,table) {
  return parseFromTable(source, table);
}

function parseFromTable(source, table) {
  console.log('\nString to parse:\n\n  ', source +'\n\n');
  source = source.replace(/\s+/g, '');
  for (var cursor = 0; cursor < source.length;) {
    var current = source[cursor];
    console.log("Stack:", stack);
    var top = stack.shift();

    if (isTerminalTable(top, table) && top === current) {
      cursor++;
      console.log("Match:", source.substr(0,cursor));
      continue;
    }

    stack.unshift.apply(stack, getProduction(table, top, current));
  }

   if(stack.length>1){
    var tempStack=stack.slice(0);
     for(var cursor = 0; cursor<stack.length-1;cursor++){
       if('$' in table[stack[cursor]]){
        console.log("Action:",stack[cursor],",ε");
        tempStack.shift();
        console.log("Stack:",tempStack);
        
       }
       else{
        throw Error('Parse error');
       }
     }
    }


  console.log('String Accepted. Productions:', productionNumbers.join(', '), '\n');
}

function isTerminalTable(symbol, table) {
  return !table.hasOwnProperty(symbol);
}

function getProduction(table, top, current) {
  if(top==="ε"){
    return null;
  }

  if(stack.length === 0){
    throw Error('Parse error');
  }

  var nextProductionNumber = table[top][current];

  if (!nextProductionNumber) {
    throw Error('Parse error, unexpected token: ' + current);
  }

  var nextProduction = grammarForParse[nextProductionNumber];

  productionNumbers.push(nextProductionNumber);
  console.log("Action:",String(nextProductionNumber)+". "+nextProduction);

  return nextProduction[1].split(/\s*/);
}

//MAIN
var EPSILON = "ε";

var firstSets = {};
var followSets = {};
var formatedFirstSets = {};
var formatedFollowSets = {};

var START_SYMBOL = 'E';

var stack = ['E', '$'];

var productionNumbers = [];

var grammar = {
  1: 'E -> TA',
  2: 'A -> +TA',
  3: 'A -> ε',
  4: 'T -> FB',
  5: 'B -> *FB',
  6: 'B -> ε',
  7: 'F -> (E)',
  8: 'F -> id'
};

var grammarForParse = {
  1: ['E', 'TA'],       
  2: ['A', '+TA'], 
  3: ['A', 'ε'],
  4: ['T', 'FB'],    
  5: ['B', '*FB'],
  6: ['B', 'ε'],
  7: ['F', '(E)'],
  8: ['F', 'id']
};

// var grammar = {
//   1: 'E -> TX',
//   2: 'T -> (E)',
//   3: 'T -> intY',
//   4: 'X -> +E',
//   5: 'X -> ε',
//   6: 'Y -> *T',
//   7: 'Y -> ε'
// };

// var grammarForParse = {
//   1: ['E', 'TX'],       
//   2: ['T', '(E)'], 
//   3: ['T', 'intY'],
//   4: ['X', '+E'],    
//   5: ['X', 'ε'],
//   6: ['Y', '*T'],
//   7: ['Y', 'ε']
// };

//Main
printGrammar(grammar);

buildFirstSets(grammar);
printSet('First sets', firstSets);
formatFirstSets(firstSets);

buildFollowSets(grammar);
printSet('Follow sets', followSets);
formatFollowSets(followSets)

console.log("Parsing Table:\n\n  ",buildParsingTable(grammar));

parse('id*(id+id)', buildParsingTable(grammar));
