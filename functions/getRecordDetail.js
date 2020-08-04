const AV = require('leanengine');

AV.Cloud.define('getRecordDetail',async function(request){


    if(!request.currentUser){
        throw new AV.Cloud.Error('Please login');
    }

    if(!request.params.record){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let goal;
    try{
        goal = await (new AV.Query('Records')).get(request.params.record);
    }catch(e){
        throw new AV.Cloud.Error('Record not exist');
    }

    return goal;

})