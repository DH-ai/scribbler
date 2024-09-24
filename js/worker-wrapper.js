﻿/**** Run In Other Processors **********/
/**** Currently supports WebWorkes 
      To add:
      		GPU
      		Cloud
      		Decentralized Distributed Computation
***/

const worker={};
worker.type='browser';

worker.webworker=null;

worker.addWebWorker=()=>{
	if(worker.webworker==undefined){
		  const workerScript="("+String(webWorkerCode)+")()";
		  const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
		  const workerScriptUrl = URL.createObjectURL(workerBlob);
		  var web_worker = new Worker(workerScriptUrl);
		  worker.webworker=web_worker;

		}

}
worker.evaluate= function(code){
	if(worker.type==='browser')
		return (0,eval)(code);
	if(worker.type==='webworker'){
	
		if(worker.webworker==undefined) worker.addWebWorker();
		return new Promise((resolve, reject) => {
		    worker.webworker.addEventListener('message', (e) => {
		    	const response=e.data;
		    	if(response.action=='result'){
		    		
		        	resolve(response.data);
		        }else if(response.action=='show'){
		        	scrib.show(response.data);
		        
		        }
		      
		    });
		    worker.webworker.addEventListener('error', (e) => {
			  console.log(e);
		      reject(e.message);
		    });
		    
		    worker.webworker.postMessage({ code });
		  });

	
	}
	
	
}
worker.run= function(_block_id){
	
	/*var show =function(x){
		show_in_dom(x,"output"+_block_id)
	}*/
	scrib.currCell=function(){
		return scrib.getDom("output"+_block_id);
	}
	
	
	scrib.getDom("run-button"+_block_id).setAttribute("data-tooltip","Running the cell");
	scrib.getDom("status"+_block_id).innerHTML='[*]'
	scrib.getDom("output"+_block_id).innerHTML=''
	
	scrib.getDom("run-button"+_block_id).innerHTML="&#8856;";
	
	const code=sandbox.editors[_block_id].getValue()
	
	setTimeout(async ()=>{
		try{
			if(scrib.getDom("cell_type"+_block_id).value=='code'){
			
				if (sandbox.statusData.running_embedded){
					scrib.getDom("result"+_block_id).style.display = "flex";
					
					
					scrib.getDom("status"+_block_id).style.display="none";
					
					scrib.getDom("input"+_block_id).style.display = "none";
			  	}else{
	
					scrib.getDom("result"+_block_id).style.display = "flex";
					
					
					scrib.getDom("status"+_block_id).style.display="inline";
					
					scrib.getDom("output"+_block_id).style.display="inline";
					scrib.getDom("input"+_block_id).style.display = "block";
				}
				
				const start_time_eval = Date.now();
				
				scrib.show=(...args)=>scrib.showInDom(`output${_block_id}`,...args);
					
								
				opt=eval(code); // This is where the magic happens.
				if(opt!=undefined) show(opt+'');
				
	
				const end_time_eval = Date.now();
				let execution_time=end_time_eval - start_time_eval;
			
				sandbox.statusData.block_run+=1;
				execution_time=execution_time>1000?execution_time/1000.0+'s':execution_time+'ms';
				scrib.getDom("status"+_block_id).innerHTML='['+sandbox.statusData.block_run+']<br><span style="font-size:8px">'+execution_time+'<span>';
				if(scrib.getDom("output"+_block_id).innerHTML.length==0 && sandbox.statusData.running_embedded)
					scrib.getDom("result"+_block_id).style.display='none';
				;
			}
			else{
				scrib.getDom("status"+_block_id).innerHTML='';
				
				scrib.getDom("output"+_block_id).innerHTML=code;
				scrib.getDom("status"+_block_id).style.display="none";
				scrib.getDom("input"+_block_id).style.display = "none";
				scrib.getDom("cell_menu"+_block_id).style.display = "none";
				scrib.getDom("result"+_block_id).style.display = "flex";
			}
		}catch(err){
			console.log(err.stack)
			scrib.getDom("result"+_block_id).style.display = "flex";
			if(typeof(err)=='string') 
			scrib.getDom("output"+_block_id).innerHTML=scrib.getDom("output"+_block_id).innerHTML+"<p class='error'>"+err+"</p>";
			else
			scrib.getDom("output"+_block_id).innerHTML=scrib.getDom("output"+_block_id).innerHTML+"<p class='error'>"+err.message+"</p>";
			scrib.getDom("status"+_block_id).innerHTML='[-]'
		}
		
		scrib.getDom("run-button"+_block_id).setAttribute("data-tooltip","Finished running the cell");
		scrib.getDom("run-button"+_block_id).innerHTML="&#9658";
		setTimeout(()=>{
			scrib.getDom("run-button"+_block_id).setAttribute("data-tooltip","Run again");
			}
		, 5000);
	},100);
}







// Wrapper function to execute a function in the worker with dynamic parameters
worker.run_in=function(processor,func, ...parameters) {
  if(is_sandboxed()) scrib.show("May not work in sandbox");
  if(processor=="web-worker" || processor=="webworker" || processor=="ww"){
	return worker.runInWW(func, ...parameters);
   }else{
   	return new Promise((resolve,reject)=>{resolve(func(...parameters))});
   }
}

// Function for running a function in a web-worker
// This will convert the function into string and send to the web-worker
worker.web_workers=[]
worker.runInWW=function(func, ...parameters) { 
  const workerScript="("+String(webWorkerCode)+")()";
  const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
  const workerScriptUrl = URL.createObjectURL(workerBlob);
  const web_worker = new Worker(workerScriptUrl);

  //const web_worker = new Worker('js/web-worker.js');
  worker.web_workers.push(web_worker);
  functionString=func.toString();
  return new Promise((resolve, reject) => {
    web_worker.addEventListener('message', (e) => {
    	const response=e.data;
    	if(response.action=='result'){
    		web_worker.terminate();
        	resolve(response.data);
        }else if(response.action=='show'){
        	scrib.show(response.data);
        
        }
      
    });
    web_worker.addEventListener('error', (e) => {
	  console.log(e);
	  web_worker.terminate();
      reject(e.message);
    });

    web_worker.postMessage({ functionString, parameters });
  });
}

worker.terminateAllWebWorkers=function() {
  for (const web_worker of worker.web_workers) {
    web_worker.terminate();
  }
  worker.web_workers.length = 0; // Clear the array
}


/** Making worker immutable so that user generated scripts cannot change the functions **/

//Object.freeze(worker);