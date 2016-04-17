///binds an element mutation to a function via an attribute setting
/// i.e, an declarative alternative to imperative jquery plugin approach
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.utils.card = factory(root.elliptical.utils);
        root.returnExports = root.elliptical.utils.card;
    }
}(this, function (utils) {
  var string=utils.string;
  
  var cards=[
      {
         name: "Visa",
         length: "13,16",
         prefixes: "4"
      },
      {
          name: "MasterCard",
          length: "16",
          prefixes: "51,52,53,54,55"
      },
      {
          name: "AmEx",
          length: "15",
          prefixes: "34,37"
      },
      {
          name: "Discover",
          length: "16",
          prefixes: "6011,622,64,65"
      },
      {
          name: "VisaElectron",
          length: "16",
          prefixes: "4026,417500,4508,4844,4913,4917"
      },
      {
          name: "DinersClub",
          length: "14,16",
          prefixes: "36,38,54,55"
      },
      {
          name: "CarteBlanche",
          length: "14",
          prefixes: "300,301,302,303,304,305"
      },
      {
          name: "enRoute",
          length: "15",
          prefixes: "2014,2149"
      },
      {
          name: "Solo",
          length: "16,18,19",
          prefixes: "6334,6767"
      },
      {
          name: "Switch",
          length: "16,18,19",
          prefixes: "4903,4905,4911,4936,564182,633110,6333,6759"
      },
      {
          name: "Maestro",
          length: "12,13,14,15,16,18,19",
          prefixes: "5018,5020,5038,6304,6759,6761,6762,6763"
      },
      {
          name: "LaserCard",
          length: "16,17,18,19",
          prefixes: "6304,6706,6771,6709"
      }
  ];
  
  //remove dashes,spaces from card number
  function trimCardNumber(cardnumber){
      cardnumber=cardnumber.replace(/-/g,"");
      cardnumber = cardnumber.replace(/\s/g, "");
      return cardnumber;
  }
  
  function encodeCvv(cvv){
      var last=string.lastChar(cvv);
      var length=cvv.length;
      var encodeLength=length-1;
      var encoded='';
      for(var i=0;i<encodeLength;i++){
          encoded+='*';
      }
      return encoded + last;
  }
  
  function getBaseCreditCardString(cardnumber){
       cardnumber=trimCardNumber(cardnumber);
       if(cardnumber.length===16) return "xxxx-xxxx-xxxx-";
       else if(cardnumber===15) return "xxxx-xxxxxx-x";
       else if(cardnumber===17) return "xxxx-xxxx-xxxx-x";
       else if(cardnumber===18) return "xxxx-xxxx-xxxx-xx";
       else if(cardnumber===19) return "xxxx-xxxx-xxxx-xxx";
       else if(cardnumber===14) return "xxxx-xxxx-xx";
       else if(cardnumber===13) return "xxxx-xxxx-x";
       else if(cardnumber===12) return "xxxx-xxxx-";
       else return "xxxx...";
  }
  
  var card={
      
      format:function(cardnumber,cvv,month,year){
          var result={
              type:null,
              number:null,
              cvv:null,
              date:null,
              valid:false
          };
          
          var validate_=this.validate(cardnumber);
          if(validate_.valid){
              result.type=validate_.type;
              result.valid=true;
          }
          result.number=this.encodeCardNumber(cardnumber);
          result.cvv=this.encodeCvvNumber(cvv);
          result.date=month.toString() + "/" + year.toString();
          
          return result;
      },
      
      validate:function(cardnumber){
          var result={
              type:null,
              valid:false
          };
          
          if (cardnumber.length == 0) {
                return result;
          }
          
          // Now remove any spaces from the credit card number
          cardnumber=trimCardNumber(cardnumber);
          // Check that the number is numeric
          var cardNo = cardnumber
          var cardexp = /^[0-9]{13,19}$/;
          if (!cardexp.exec(cardNo)) {
               return result;
          }
          if (cardNo == '5490997771092064') {
               return result;
          }
          if(!this.validateChecksum(cardNo)) return result;
          
          for(var j=0;j<cards.length;j++){
              var type=this.validateCardType(j,cardNo);
              if(type) {
                  result.type=type;
                  result.valid=true;
                  break;
              }
          }
          
          return result; 
      },
      
      validateChecksum:function(cardNo){
          var checksum = 0; // running checksum total
          var mychar = "";  // next char to process
          var j = 1;        // takes value of 1 or 2

          // Process each digit one by one starting at the right
          var calc;
          for (i = cardNo.length - 1; i >= 0; i--) {
              // Extract the next digit and multiply by 1 or 2 on alternative digits.
              calc = Number(cardNo.charAt(i)) * j;
              // If the result is in two digits add 1 to the checksum total
              if (calc > 9) {
                  checksum = checksum + 1;
                  calc = calc - 10;
              }
              // Add the units element to the checksum total
              checksum = checksum + calc;
              // Switch the value of j
              if (j == 1) { j = 2 } else { j = 1 };
           }

           // All done - if checksum is divisible by 10, it is a valid modulus 10.
           // If not, report an error.
           if (checksum % 10 != 0) return false;
           else return true; 
      },
      
      validateCardType:function(index,cardNo){
          var LengthValid = false;
          var PrefixValid = false;
          var undefined;

          // We use these for holding the valid lengths and prefixes of a card type
          var prefix = new Array();
          var lengths = new Array();

          // Load an array with the valid prefixes for this card
          prefix = cards[index].prefixes.split(",");

          // Now see if any of them match what we have in the card number
          for (i = 0; i < prefix.length; i++) {
             var exp = new RegExp("^" + prefix[i]);
             if (exp.test(cardNo)) PrefixValid = true;
          }

          // If it isn't a valid prefix there's no point at looking at the length
          if (!PrefixValid) {
             return null;
          }

          // See if the length is valid for this card
          lengths = cards[index].length.split(",");
          for (j = 0; j < lengths.length; j++) {
             if (cardNo.length == lengths[j]) LengthValid = true;
          }
          
          if (!LengthValid) return null;
          else return cards[index].name;
      },
      
      encodeCardNumber:function(cardnumber){
          var last4=string.lastNChars(cardnumber,4);
          var encodeBase=getBaseCreditCardString(cardnumber);
          return encodeBase + last4;
      },
      
      encodeCvvNumber:function(cvv){
          return encodeCvv(cvv);
      }
  };



return card;

}));
