import storage from '../utils/libs/storage';
import Promise from 'promise';

export default {

    remove(key){
        storage.remove(key);
    },
    set(key, data, pattern){
        storage.set(key, data, pattern);
    },

    get(key, fn){

        if (typeof fn !== "function") {
            fn = function (_) { return _}
        }
        let data = storage.get(key);
        if (data) {
            var promise = new Promise(function (resolve, reject) {
                setTimeout(function () {
                    let tmp = fn(data);
                    tmp ? resolve(tmp) : reject(data);
                }, 0);
            });
            return promise;
        } else {
            return null;
        }

    }


}
