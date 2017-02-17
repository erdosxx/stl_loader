var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(5, 5, 5)
camera.lookAt(new THREE.Vector3(0, 0, 0))
var controls = new THREE.OrbitControls(camera)
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x999999)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

var cone = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 6),
    new THREE.MeshNormalMaterial()
)

var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshNormalMaterial()
)

sphere.position.set(1, 0, 1)
scene.add(cone)
scene.add(sphere)
scene.add(new THREE.AxisHelper(100))

var closestPoint = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
)

scene.add(closestPoint)
closestPoint.position.set(0, 3, 0)

function movePoint(t) {
    t = t * 0.0005
    sphere.position.x = Math.sin(t)
    sphere.position.z = Math.cos(t)
    sphere.position.y = Math.cos(t * 1.5) * 2
}

function sameSide(p1,p2,a,b) {
    var ab = b.clone().sub(a)
    var ap1 = p1.clone().sub(a)
    var ap2 = p2.clone().sub(a)
    var cp1 = new THREE.Vector3().crossVectors(ab, ap1)
    var cp2 = new THREE.Vector3().crossVectors(ab, ap2)
    return cp1.dot(cp2) >= 0
}

function pointInTriangle(p, a, b, c) {
    return sameSide(p,a,b,c) && sameSide(p,b,a,c) && sameSide(p,c,a,b)
}

function closestToSegment(p, a, b) {
    var ab = b.clone().sub(a)
    var nab = ab.clone().normalize()
    var n = nab.dot(p.clone().sub(a))
    if (n < 0) return a
    if (n > ab.length()) return b
    return a.clone().add(nab.multiplyScalar(n))
}

function closestToSides(p, sides) {
    var minDist = 1e9
    var ret
    sides.forEach(function (side) {
        var ct = closestToSegment(p, side[0], side[1])
        var dist = ct.distanceTo(p)
        if (dist < minDist) {
            minDist = dist
            ret = ct
        }
    })
    return ret
}

function closestPointToTriangle(p, a, b, c) {
    // if the point is inside the triangle then it's the closest point
    if (pointInTriangle(p,a,b,c)) return p
    // otherwise it's the closest point to one of the sides
    return closestToSides(p, [[a, b], [b, c], [a, c]])
}

function updateClosestPointPosition() {
    var p = sphere.position
    var geom = cone.geometry
    // inf
    var closestDistance = 1e9
    var closestFace = geom.faces.forEach(function (face) {
        var normal = face.normal
        var va = geom.vertices[face.a]
        var vb = geom.vertices[face.b]
        var vc = geom.vertices[face.c]
        var pd = normal.dot(p.clone().sub(va))
        // move p -(pd - td) units in the direction of the normal
        var proj = p.clone().sub(normal.clone().multiplyScalar(pd))
        // closest point of proj and the triangle
        var cp = closestPointToTriangle(proj, va, vb, vc)
        if (cp.distanceTo(p) < closestDistance) {
            closestDistance = cp.distanceTo(p)
            closestPoint.position.copy(cp)
        }
    })

}

function render(t) {
    movePoint(t)
    updateClosestPointPosition()

    controls.update()
    renderer.render(scene, camera)

    requestAnimationFrame(render)
}

requestAnimationFrame(render)