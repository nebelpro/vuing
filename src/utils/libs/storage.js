import  __Storage from "store";


export default {
    clear(){
        clearExpireCache();
    },
    remove: function (key) {
        __Storage.remove(key);
    },
    set: function (key, val, {exp = -1, read = -1}) {
        let expTime = exp == -1 ? -1 : exp * (60 * 1000);
        __Storage.set(key, {
            val: val,
            exp: expTime,
            time: new Date().getTime(),
            read: read
        })

        // 时间过期，需要放到跟踪队列，读取次数过期不需要，因为读取的时候，读取完，会判断是否还有剩余次数，没有则销毁
        if(expTime>0){
            pushCacheQuery(key);
        }
    },
    get: function (key) {
        var info = __Storage.get(key);

        if (!info) {
            return null
        }

        // 时间策略
        if(!checkExpireViaTime(key,info)){
            return null;
        }
        //读取次数策略
        if(!checkExpireViaRead(key,info)){
            return null;
        }

        return info.val;
    }
}


/**
 * 将缓存加入标记
 * @param key
 */
function pushCacheQuery(key){
    let curStore = __Storage.get("@@EXPIRE_STORE") || [];
    curStore.push(key);
    __Storage.set('@@EXPIRE_STORE',curStore);
}


/**
 * 清除已过期的缓存
 */
function clearExpireCache(){
    let curStore = __Storage.get("@@EXPIRE_STORE") || [];

    curStore.forEach(key=>{
        checkExpireViaTime(key)
    })
}



function checkExpireViaTime(key,info){
     info = info || __Storage.get(key);
    if (info.exp != -1 && (new Date().getTime() - info.time > info.exp)) {
        __Storage.remove(key);
        return false;
    }else{
        return true;
    }
}

function checkExpireViaRead(key,info){
    info = info || __Storage.get(key);

    if (info && info.read != -1) {

        let readed = (info.readed || 0);

        if(readed>=info.read){
            __Storage.remove(key);
            return false;
        }else{
            let curReadTime = readed+1;
            if (curReadTime == info.read) {
                __Storage.remove(key);
            }else{
                info.readed = curReadTime;
                __Storage.set(key, info);
            }
            return true;
        }

    } else {
        return true;
    }
}