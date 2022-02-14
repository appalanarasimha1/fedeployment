export function createDownloadQuery() {
    return [
        {
            '$match': {
                'eventId': 'download',
                docType: {'$in': ['Video','Picture','File']}
            }
        },{
            '$group': {
                _id: {'type': '$docType', 'user': '$principalName'},
                count: {'$sum': 1}
              }
        },{
            '$group': {
                _id: '$_id.user',
                countType: {'$push': {type:'$_id.type', count: '$count'}}
              }
        }
    ];
}