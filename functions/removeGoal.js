const AV = require('leanengine');



AV.Cloud.define('removeGoal',async function(request){
    console.log(request.params);
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

    if(!record){
        throw new AV.Cloud.Error('Goal not exist');
    }


    await goal.destroy();

    return {
        msg: 'success'
    }
})