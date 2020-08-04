const AV = require('leanengine');

AV.Cloud.define('getGoalDetail',async function(request){


    if(!request.currentUser){
        throw new AV.Cloud.Error('Please login');
    }

    if(!request.params.goal){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let goal;
    try{
        goal = await (new AV.Query('Goals')).get(request.params.goal);
    }catch(e){
        throw new AV.Cloud.Error('Goal not exist');
    }

    if(goal.get('user').toJSON().objectId  !== request.currentUser.toJSON().objectId){
        throw new AV.Cloud.Error('No access');
    }

    return goal;

})