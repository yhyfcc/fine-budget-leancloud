const AV = require('leanengine');

AV.Cloud.define('editGoal',async function(request){
    let body = request.params;
    if(!body.goal){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let goal;
    try{
        goal = await (new AV.Query('Goals')).get(body.goal);
    }catch(err){
        throw new AV.Cloud.Error('Goal not exist');
    }

    if(!goal){
        throw new AV.Cloud.Error('Goal not exist');
    }

    if (goal.get('user').toJSON().objectId !== request.currentUser.toJSON().objectId) {
        throw new AV.Cloud.Error('No access');
    }

    let current = body.current ? body.current : goal.get('current');
    let target = body.target ? body.target : goal.get('target');
    
    if(body.description){
        goal.set(body.description);
    }

    goal.set('current',current);
    goal.set('target',target);

    if(current >= target){
        goal.set('fulfilled',true);
    }else{
        goal.set('fulfilled',false);
    }
    goal.set('description',body.description);

    return goal.save();
})