const AV = require('leanengine');


AV.Cloud.define('changeUserSetting',async function(request){
    if(!request.currentUser){
        throw new AV.Cloud.Error('Please login');
    }

    if(request.params.baseCurrency){
        request.currentUser.set('baseCurrency',request.params.baseCurrency);
    }

    if(request.params.displayCurrency){
        request.currentUser.set('baseCurrency',request.params.displayCurrency);
    }

    if(request.params.monthlyLimit){
        request.currentUser.set('baseCurrency',request.params.monthlyLimit);
    }

    return request.currentUser.save();
})