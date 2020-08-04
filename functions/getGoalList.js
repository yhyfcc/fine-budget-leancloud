const AV = require('leanengine');

AV.Cloud.define('getGoalList',async function(request){


    if(!request.currentUser){
        throw new AV.Cloud.Error('Please login');
    }

    let query = new AV.Query('Goals');

    query.equalTo('user',request.currentUser);

    query.descending('createdAt');

    return query.find();

})