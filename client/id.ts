let id = 0;
let last = Date.now();

export function resetId(){
  last = Date.now();
  id = 0;
}

export function getId(): number {
  id += 1;
  if(Date.now() - last >= 1e10) {
    resetId();
    id += 1;
  } 
  return id;
}
