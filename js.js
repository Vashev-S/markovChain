var markovChainTextGenerator = {
  articleDictionary : {},    //dictionary for article
  commentsDictionary : {},   //dictionary for comments
  userNames : {},            //dictionary of user names
  sentenceInParagraphs : {'max':15,'min':3}, //min, max sentence in paragraph
  paragraphsInArticle : {'max':10,'min':1},  //min, max paragraphs in article
  commentsInArticle : {'max':150,'min':50},  //min, max comments in block of comments, not counting nested comments
  sentenceInComment : {'max':10,'min':1},    //min, max sentence in comment
  wordsInSentence : {'max':30,'min':10},     //min, max words in sentence
  //get text from $(selector), without children elements
  getText : function(selector,mode){  
    var text = '';
    $(selector).each(function(){
      text += ' '+
      $(this)
        .clone()    //clone the element
        .children() //select all the children
        .remove()   //remove all the children
        .end()      //again go back to selected element
        .text();
    });
    var cutText = text.replace(/\n\r|\r|\n/g, '').trim();  //delete /\n/ and trim whitespaces
        cutText = cutText.replace(/\d+[A-zА-яЁё\d]+[.,?!]|[A-zА-яЁё]+[.,?!]/g,"$& "); //prepare 2 split
    if(mode=='unCut')
      return text;
    else 
      return cutText;
  },
  //geting dictionary
  getDctnr : function(typeOfDictionary){
    var text = this.getText(typeOfDictionary);
    var startWords = {};  //starting words
    var endWords = {};    //ending words
    var contentWords = {};//all words
    var wordsArray = text.split(/[^A-zА-яЁё\d.?,!'"]+/);
    //create hash table
    for (var i=0; i<wordsArray.length; i++){
      //search for words starting sentence and check of duplication in table
      if(wordsArray[i].search(/^[А-ЯЁ]|^[A-Z]/)!=-1 && wordsArray[i].search(/\.$/)==-1 && !startWords.hasOwnProperty(wordsArray[i]))
        startWords[wordsArray[i]] = '';
      //search for words ending sentence and check of duplication in table
      if(wordsArray[i].search(/[?.!]+$/)!=-1 && !endWords.hasOwnProperty(wordsArray[i]))
        endWords[wordsArray[i-1]] = wordsArray[i];
      //search for word-extenders(without end words)  and check of duplication in table
      if(!contentWords.hasOwnProperty(wordsArray[i]) && wordsArray[i].search(/\.$/)==-1)
        contentWords[wordsArray[i]] = [];
    };
    //looking for a suffix
    for(var i=0; i<=wordsArray.length; i++){
      if(contentWords[wordsArray[i]])
        contentWords[wordsArray[i]].push(wordsArray[i+1]);
    };
    return {'startWords': startWords, 'endWords': endWords, 'contentWords': contentWords};
  },
  //get random [key,value] from hash table
  getRandomProperty : function(obj) {
    var tmpList = Object.keys(obj);  //list with object keys
    var randomPropertyName = tmpList[ Math.floor(Math.random()*tmpList.length) ];
    return { 'name':randomPropertyName, 'value':obj[randomPropertyName] };
  },
  //get date for comments 
  getDate : function(date){
    var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    var hours = date.getUTCHours() < 10 ? '0'+date.getUTCHours()  : date.getUTCHours();
    var minutes = date.getUTCMinutes() < 10 ? '0'+date.getUTCMinutes()  : date.getUTCMinutes();
    var monthNum= date.getUTCMonth();
    var day = date.getUTCDate() < 10 ? '0'+date.getUTCDate()  : date.getUTCDate();
    return  day+' '+months[monthNum]+' '+hours+':'+minutes;
  },
  //generation sentence
  generateSentence : function(typeOfDictionary,counter){
    counter = typeof counter !== 'undefined' ? counter : 0;  //the recursions counter
    var max = parseInt(this.wordsInSentence['max']);
    var min = parseInt(this.wordsInSentence['min']);
    //validation of input data
    if(max<min || counter>20){
      console.log('Error, can not generate sentence');
      return 0;
    };
    var randomValue = 0;
    var result = {};
    var dictionary = this[typeOfDictionary];                                //get dictionary
    var prefix = this.getRandomProperty(dictionary['startWords'])['name'];  //get random first word in the pair of words(prefix)
    var suffix = dictionary['contentWords'][prefix][randomValue];           //get second word in the pair of words(suffix)
    result['sentence'] = prefix+' '+suffix;                                 //result text
    result['wordsInSentence'] = 2;                                          //the number of words in a sentence
    for(var i=0; i<max; i++){
      prefix = suffix; //new prefix it's old suffix
      //checking the existence of the next word(suffix)
      if(dictionary['contentWords'][prefix])
        randomValue = Math.floor(Math.random()*dictionary['contentWords'][prefix].length);  //random index of the suffix array
      else break;
      //trying to find the final word
      if(i>min && dictionary['endWords'][prefix]){
        suffix = dictionary['endWords'][prefix];
        result['sentence'] += ' '+ suffix;
        result['wordsInSentence']++;
        break;
      }else{
        //get new suffix
        suffix = dictionary['contentWords'][prefix][randomValue];
        result['sentence'] += ' '+ suffix;
        result['wordsInSentence']++;
      }
      //checking for overflow words
      if(result['wordsInSentence']==max){
        result['sentence']+='.'  //put an endpoint into sentence
        break;
      };
    };
    //check for min number of words in the sentence
    if(result['wordsInSentence']<min){
      //repeat function until get required results
      result = this.generateSentence(typeOfDictionary,++counter);
      //check for maximum call stack size 
      if(result && result['wordsInSentence']>=min){
        return result;
      };
    }else{
      return result;
    }
  },
  //generate paragraph or comment. 2 input obj with required numbers: {max:num,min:num}
  generateParagraph : function(typeOfDictionary){
    var paragraph = '';
    var max = parseInt(this.sentenceInParagraphs['max']);
    var min = parseInt(this.sentenceInParagraphs['min']);
    //validation of input data
    if(max<min){
      console.log('Error, can not generate paragraph');
      return 0;
    };
    var numberOfSentence = Math.floor(Math.random() * (max - min + 1)) + min;  //random number of sentences between min and max
    for(var i=0; i<numberOfSentence; i++){
      paragraph += ' '+this.generateSentence(typeOfDictionary)['sentence'];
    };
    paragraph +='</br></br>';
    return paragraph;
  },
  //generate article. 3 input obj with required numbers: {max:num,min:num}
  generateArticle : function(){
    var article = '';
    var max = parseInt(this.paragraphsInArticle['max']); //maximum number of paragraphs in the article
    var min = parseInt(this.paragraphsInArticle['min']); //minimum number of paragraphs in the article
    //validation of input data
    if(max<min){
      console.log('Error, can not generate article');
      return 0;
    };
    var numberOfParagraphs = Math.floor(Math.random() * (max - min + 1)) + min;  //random number of paragraphs between min and max
    article +='<article>';
    for(var i=0; i<numberOfParagraphs; i++){
      article += ' '+this.generateParagraph('articleDictionary');
    };
    return article;
  },
  //generate block of comments. 3 input obj with required numbers: {max:num,min:num}
  generateBlockOfComments: function(){
    var userName = '';  //name of user
    var blockOfComments = '';
    var date = new Date();  //get current date
    var addRandomTime = Math.floor(Math.random() * (51)) + 10;  //random int value(minutes) [10;60]
    var max = parseInt(this.commentsInArticle['max']); //maximum number of comments for the article
    var min = parseInt(this.commentsInArticle['min']); //minimum number of comments for the article
    //validation of input data
    if(max<min){
      console.log('Error, can not generate block of comments');
      return 0;
    };
    var numberOfComments = Math.floor(Math.random() * (max - min + 1)) + min;  //random number of comments between min and max
    for(var i=0; i<numberOfComments; i++){
      blockOfComments += this.generateComments(date);
      date = new Date(date.getTime()+addRandomTime*60000);
    };
    blockOfComments = '<section class="comments">'+ blockOfComments +'</section></article>';  //end of comments and article
    return blockOfComments;
  },
  //generate nested comments
  generateComments : function(date,comment){
    comment = typeof comment !== 'undefined' ? comment : '';
    var curComment = '';
    var userName = this.getRandomProperty(this.userNames['contentWords'])['name'];  //get random user name from "this.userNames['contentWords']"
    var itHasNested = Math.random() < 0.26 ? 1 : 0;  //~26% of commets has nested comment
    var addRandomTime = Math.floor(Math.random() * (51)) + 10;  //random int value(minutes) [10;60]
    var commentDate = this.getDate(date);
    curComment += '<div class="comment">';  //start ".comment"
    curComment += '<div class="username">'+userName+' - '+commentDate+'</div>';  //user Name + date
    curComment += '<div class="message">'+this.generateParagraph('commentsDictionary')+'</div>';  //message of comment
    if(itHasNested){
      date = new Date(date.getTime()+addRandomTime*60000);
      comment += this.generateComments(date,curComment);
    };
    comment += '</div></div>';  //end of ".comment"
    return comment;
  },
  //geting average values from text(paragraphs,length,sentence in paragraphs etc)
  getingAverageValues : function(){
    var numberOfParagraphs = this.getText('article','unCut').match(/\n+[A-zА-яЁё]/g).length;
    var numberOfArticles = $('article').length;   //number of articles in sheet
    var numberOfComments = $('.comment').length;  //number of comments in sheet

    var avgParagraphs = Math.floor(numberOfParagraphs/numberOfArticles);  //average number of paragraphs in the articles
    var maxParagraphs = Math.floor(avgParagraphs*1.1);                    //max number of paragraphs in generate article
    var minParagraphs = Math.floor(avgParagraphs*0.9);                    //min number of paragraphs in generate article
    this.paragraphsInArticle = {'max':maxParagraphs,'min':minParagraphs}; //prepare input data

    var avgComments = Math.floor(numberOfComments/numberOfArticles); //average number of comments in the articles
    var maxComments = Math.floor(avgComments*1.1);                   //max number of paragraphs in generate article
    var minComments = Math.floor(avgComments*0.9);                   //min number of paragraphs in generate article
    this.commentsInArticle = {'max':maxComments,'min':minComments};  //prepare input data
    //display values
    $('.maxParagraphs').val(maxParagraphs);
    $('.minParagraphs').val(minParagraphs);
    $('.maxSentence').val('5');
    $('.minSentence').val('3');
    $('.maxWords').val('40');
    $('.minWords').val('10');
    $('.maxComments').val(maxComments);
    $('.minComments').val(minComments);
  },
  //generate complete article 
  generateCompleteArticle : function(){
    //geting values from inputs
    this.paragraphsInArticle['max'] = $('.maxParagraphs').val();
    this.paragraphsInArticle['min'] = $('.minParagraphs').val();

    this.sentenceInParagraphs['max'] = $('.maxSentence').val();
    this.sentenceInParagraphs['min'] = $('.minSentence').val();

    this.wordsInSentence['max'] = $('.maxWords').val();
    this.wordsInSentence['min'] = $('.minWords').val();

    this.commentsInArticle['max'] = $('.maxComments').val();
    this.commentsInArticle['min'] = $('.minComments').val();
    //prepare dictionaries
    markovChainTextGenerator.articleDictionary = markovChainTextGenerator.getDctnr('article');    //prepare  dictionary of articles
    markovChainTextGenerator.commentsDictionary = markovChainTextGenerator.getDctnr('.message');  //prepare  dictionary of comments
    markovChainTextGenerator.userNames = markovChainTextGenerator.getDctnr('.username');          //prepare  dictionary of user names
    //generating
    var article = this.generateArticle();           //geting article
    var comments = this.generateBlockOfComments();  //geting comments
    var complete = article + comments;
    //put in html
    $('.newArticle').html('<h1>GENERATED ARTICLE</h1>');
    $('.newArticle').append(complete);
  }
};
$(document).ready(function(){
  markovChainTextGenerator.getingAverageValues();
  $( ".generateButton" ).click(function() {
console.time('generation');
    markovChainTextGenerator.generateCompleteArticle();
console.timeEnd('generation');  //anyway you will be interested
  });
});