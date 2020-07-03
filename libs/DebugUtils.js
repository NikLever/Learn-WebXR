function vector2ToString( v, count ){
    return `x:${v.x.toFixed(count)},y:${v.y.toFixed(count)}`;
}

function vector3ToString( v, count ){
    return `x:${v.x.toFixed(count)},y:${v.y.toFixed(count)},z:${v.z.toFixed(count)}`;
}

function quaternion3ToString( q, count ){
    return `x:${q.x.toFixed(count)},y:${q.y.toFixed(count)},z:${q.z.toFixed(count)},w:${q.w.toFixed(count)}`;
}

export { vector2ToString, vector3ToString, quaternion3ToString };