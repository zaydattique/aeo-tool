export type Observation = { value:number; weight?:number; confidence?:number };

export function weightedMean(values: Observation[]): number {
  if (!values.length) return 0;
  let numerator=0, denominator=0;
  for (const v of values) {
    const weight=(v.weight ?? 1) * (v.confidence ?? 1);
    numerator += v.value * weight; denominator += weight;
  }
  return denominator ? numerator/denominator : 0;
}

export function rate(numerator:number, denominator:number): number {
  if (denominator < 0 || numerator < 0 || numerator > denominator) throw new Error("INVALID_RATE_INPUT");
  return denominator === 0 ? 0 : numerator/denominator;
}

export function correlation(xs:number[], ys:number[]): number {
  if (xs.length !== ys.length || xs.length < 2) throw new Error("INVALID_CORRELATION_INPUT");
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length, my=ys.reduce((a,b)=>a+b,0)/ys.length;
  let n=0, dx=0, dy=0;
  for(let i=0;i<xs.length;i++){const x=xs[i]-mx,y=ys[i]-my;n+=x*y;dx+=x*x;dy+=y*y;}
  return dx && dy ? n/Math.sqrt(dx*dy) : 0;
}
