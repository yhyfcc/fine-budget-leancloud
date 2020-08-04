const AV = require('leanengine');


AV.Cloud.define('removeMultiRecords',async function(request){
    let body = request.params;

    if(!body.records){
        throw new AV.Cloud.Error('Invalid parameters');
    }

    let records = Array.from(body.records);

    let operations = [];

    records.forEach(record => {
        console.log({
            ...body,
            currentUser: request.currentUser
        })
        operations.push(AV.Cloud.run('removeRecord',{
            record,
            currentUser: request.currentUser
        }));
    });

    await Promise.all(operations);
    return 'success';
})

