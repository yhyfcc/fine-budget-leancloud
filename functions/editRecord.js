const AV = require('leanengine');

AV.Cloud.define('editRecord',async function(request){

    let body = request.params;
    if(!body.record){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let record;
    try{
        record = await (new AV.Query('Records')).get(body.record);
    }catch(err){
        throw new AV.Cloud.Error('Record not exist');
    }

    if(!record){
        throw new AV.Cloud.Error('Record not exist');
    }

    if(request.currentUser.toJSON().objectId !== record.get('user').toJSON().objectId){
        throw new AV.Cloud.Error('No access');
    }

    if(body.description){
        record.set('description',body.description);
    }

    if(!body.date && !body.amount && !body.category){
        return record.save();
    }
    console.log(record.get('category').toJSON().objectId);

   
    let [__,result] = await Promise.all([
        AV.Cloud.run('removeRecord',{
            ...request.params,
            currentUser: request.currentUser
        }),
        AV.Cloud.run('addRecord',{
        category: body.category ? body.category : record.get('category').toJSON().objectId,
        date: body.date ? body.date : record.get('date').toISOString(),
        amount: body.amount ? body.amount : record.get('amount'),
        description: body.description ? body.description : record.get('description'),
        currentUser: request.currentUser
    })]);

    return result;
})