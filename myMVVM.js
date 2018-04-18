function myMVVM(options={}){
  this.options=options;
  var data=this.$data=options.data;
  for(let key in data){
    Object.defineProperty(this,key,{
      enumerable:true,
      configurable:false,
      get:function(){
        return this.$data[key]
      },
      set:function(newData){
        this.$data[key]=newData
      }
    })
  }

  observe(data);
  InitComputed.call(this);
  Compile(options.el,this);
}

function Observe(data){
  let subscr=new Subscrible()
  for(let key in data){
    let val=data[key];
    observe(val);
    Object.defineProperty(data,key,{
      configurable:false,
      enumerable:true,
      get:function(){
        Subscrible.target&&subscr.addSubs(Subscrible.target);
        return val
      },
      set:function(newData){
        if(val===newData)return;
          val=newData;
          observe(newData);
          subscr.notify()
      }
    })
  }
}

function observe(data){
  if(!data||typeof data!=='object')return;
  return new Observe(data)
}

function Compile(el,vm){
  vm.$el=document.querySelector(el);
  let fragment=document.createDocumentFragment();
  while(child=vm.$el.firstChild){
    fragment.appendChild(child)
  }
  let reg=/\{\{(.*)\}\}/;
  replace(fragment)

  function replace(fragment){
    Array.from(fragment.childNodes).forEach(function(node){
      //console.log(node)
      let text=node.textContent;
      //console.log(text)
      if(node.nodeType===3&&reg.test(text)){
        //console.log(RegExp.$1);
        let arr=RegExp.$1.split('.');
        //console.log(arr)
        let val=vm;
        //console.log(val)
        arr.forEach(function(key){
          val=val[key]
          //console.log(val)
        });
        new Watcher(vm,RegExp.$1,function(newVal){
          //console.log(RegExp.$1)
          node.textContent=text.replace(reg,newVal)
        })
        node.textContent=text.replace(reg,val)
      }
      if(node.nodeType===1){
        let nodeAttrs=node.attributes;
        //console.log(nodeAttrs);
        Array.from(nodeAttrs).forEach(function(attr){
          //console.log(attr)
          let name=attr.name;
          //console.log(name)
          let exp=attr.value;
          //console.log(exp)
          if(name.indexOf('v-')==0){
            node.value=vm[exp];
            //console.log(node.value)
          }
          new Watcher(vm,exp,function(newVal){
            node.value=newVal;
          });

          node.addEventListener('input',e=>{
            let newVal=e.target.value;
            vm[exp]=newVal;
          })
        })
      }
      if(node.childNodes){
        replace(node)
      }
    })
  }

  vm.$el.appendChild(fragment)

}

function Subscrible(){
  this.subs=[]
}
Subscrible.prototype.addSubs=function(sub){
  this.subs.push(sub);
}
Subscrible.prototype.notify=function(){
  this.subs.forEach(sub=>sub.update())
}

function Watcher(vm,exp,fn){
  this.fn=fn;
  this.vm=vm;
  this.exp=exp;
  Subscrible.target=this;
  let val=vm;
  let arr=exp.split('.');
  arr.forEach(function(key){
    val=val[key]
  })
  Subscrible.target=null;
}
Watcher.prototype.update=function(){
  let val=this.vm;
  let arr=this.exp.split('.');
  arr.forEach(function(key){
    val=val[key]
  })
  this.fn(val)
}

function InitComputed(){
  let vm=this;
  let computed=this.options.computed;
  Object.keys(computed).forEach(function(key){
    Object.defineProperty(vm,key,{
      get:typeof computed[key]==='function'?computed[key]:computed[key].get,
      set(){}
    });
  })
}
