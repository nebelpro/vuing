import Promise from 'promise';

window.ajaxQueueData = window.ajaxQueueData || {};

export default {
    check(key){
        let queue = window.ajaxQueueData;
        if(!queue[key]){  //not in
            queue[key] = 1;
            return null;
        }else{
            return new Promise(function (resolve, reject) {});
        }
    },
    remove(key){
        delete window.ajaxQueueData[key];
    }

}