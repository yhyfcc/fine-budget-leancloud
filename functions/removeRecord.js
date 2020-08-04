const AV = require('leanengine');

const changeStat = async (_user,_type,_date,_amount,ioType,isForCategory,_category,updateArray) => {

    //date is a ISO date string
    let date = new Date(_date);
    date.setHours(0, 0, 0);
    if(_type === 'month'){
        date.setUTCDate(1);
    }else if(_type === 'year'){
        date.setMonth(0);
        date.setDate(1);
    }else{
        // its type is day,nothing needs to be further changed
    }
    console.log(date);
    let query = new AV.Query('Statistics');
    query.equalTo('user', _user);
    query.equalTo('type', _type);
    query.equalTo('io',ioType);
    query.equalTo('forCategory', isForCategory);
    query.equalTo('date', { __type: 'Date', iso: date.toISOString() })
    
    if(isForCategory){
        query.equalTo('category', { __type: 'Pointer', className: 'Category', objectId: _category });
    }

    let result = await query.find();
    console.log('Same ' + _type + (isForCategory ? ' with' : ' no') + ' category');
    console.log('user ',_user.objectId, ',type ',_type,',io ',ioType,',forCategory ',isForCategory,',date ',date,'category',_category);
    let updatedObject;
  
    result[0].increment('value', -1 * _amount);
    updatedObject = result[0].save();
    

    updateArray.push(updatedObject);
}



AV.Cloud.define('removeRecord',async function(request){
    console.log(request);
    let body = request.params;
    if(!request.currentUser){
        request.currentUser = body.currentUser;
    }

    if(!body.record){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let record;

    try{
        record = await (new AV.Query('Records')).include('category').get(body.record);
    }catch(err){
        throw new AV.Cloud.Error('Record not exist');
    }

    if(!record){
        throw new AV.Cloud.Error('Record not exist');
    }

    let date = record.get('date').toISOString();
    let amount = record.get('amount');
    let categoryIoType = record.get('category').get('io');
    let categoryID = record.get('category').get('objectId');
    let sideEffects = [];
    let fcnRuns = [];
    // let query = new AV.Query('Statistics');
    // let date = new Date(body.date);
    // date.setUTCHours(0, 0, 0);
    // query.equalTo('user', _user);
    // query.equalTo('type', _type);
    // query.equalTo('io',ioType);
    
    //Stat for each month, no category specified
    fcnRuns.push(changeStat(request.currentUser,'month',date,amount,categoryIoType,false,null,sideEffects));
    //Stat for each month, with category specified
    fcnRuns.push(changeStat(request.currentUser,'month',date,amount,categoryIoType,true,categoryID,sideEffects));
    //Stat for each day, no category specified
    fcnRuns.push(changeStat(request.currentUser,'day',date,amount,categoryIoType,false,null,sideEffects));

    await Promise.all(fcnRuns);
    await Promise.all([AV.Object.saveAll(sideEffects),record.destroy()]);

    return {
        msg: 'success'
    }
})