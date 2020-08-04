const AV = require('leanengine');

AV.Cloud.define('getRecords',async function(request){
    let body = request.params;
    
    if(!body.startDate || !body.endDate ){
        throw new AV.Cloud.Error('Invalid parameters');
    }


    let startDate = new Date(body.startDate);
    let endDate = new Date(body.endDate);


    console.log('Start',startDate);
    console.log('End',endDate);

    let query = new AV.Query('Statistics');

    query.equalTo('user',request.currentUser);
    query.lessThanOrEqualTo('date',endDate);
    query.greaterThanOrEqualTo('date',startDate);

    query.ascending('date');

    let result = (await query.find());

    let JSONResult = [];
    result.forEach(curr => {
        JSONResult.push(curr.toJSON());
    })

    console.log(JSONResult);

    if(result.length === 0){
        return result;
    }

    let resultGroupByDay = [];

    let currDate = new Date(JSONResult[0].date);
    resultGroupByDay.push({
        date: currDate,
        records: [
            JSONResult[0]
        ]
    })
    let j = 0;
    for(let i = 1;i< JSONResult.length; i++){
        if( (new Date(JSONResult[i].date)).toString() !== currDate.toString()){
            currDate = new Date(JSONResult[i].date);
            j = j + 1;
            resultGroupByDay.push({
                date: currDate,
                records: [
                    JSONResult[i]
                ]
            })
        }else{
            resultGroupByDay[j].records.push(JSONResult[i]);
        }
    }


    return resultGroupByDay;

    
})