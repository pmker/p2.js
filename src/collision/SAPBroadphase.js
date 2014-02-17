var Circle = require('../shapes/Circle')
,   Plane = require('../shapes/Plane')
,   Shape = require('../shapes/Shape')
,   Particle = require('../shapes/Particle')
,   Utils = require('../utils/Utils')
,   Broadphase = require('../collision/Broadphase')
,   vec2 = require('../math/vec2')

module.exports = SAPBroadphase;

/**
 * Sweep and prune broadphase along one axis.
 *
 * @class SAPBroadphase
 * @constructor
 * @extends Broadphase
 */
function SAPBroadphase(){
    Broadphase.apply(this);

    /**
     * List of bodies currently in the broadphase.
     * @property axisList
     * @type {Array}
     */
    this.axisList = [];

    /**
     * The world to search in.
     * @property world
     * @type {World}
     */
    this.world = null;

    /**
     * Axis to sort the bodies along. Set to 0 for x axis, and 1 for y axis. For best performance, choose an axis that the bodies are spread out more on.
     * @property axisIndex
     * @type {Number}
     */
    this.axisIndex = 0;

    var axisList = this.axisList;

    this._addBodyHandler = function(e){
        axisList.push(e.body);
    };

    this._removeBodyHandler = function(e){
        var idx = axisList.indexOf(e.body);
        if(idx !== -1)
            axisList.splice(idx,1);
    }

    /*
    // Add listeners to update the list of bodies.
    world.on("addBody",function(e){
        axisList.push(e.body);
    }).on("removeBody",function(e){
        var idx = axisList.indexOf(e.body);
        if(idx !== -1)
            axisList.splice(idx,1);
    });
    */
};
SAPBroadphase.prototype = new Broadphase();

/**
 * Change the world
 * @method setWorld
 * @param  {World} world
 */
SAPBroadphase.prototype.setWorld = function(world){
    // Clear the old axis array
    this.axisList.length = 0;

    // Add all bodies from the new world
    Utils.appendArray(this.axisList,world.bodies);

    // Remove old handlers, if any
    world
        .off("addBody",this._addBodyHandler)
        .off("removeBody",this._removeBodyHandler);

    // Add handlers to update the list of bodies.
    world.on("addBody",this._addBodyHandler).on("removeBody",this._removeBodyHandler);

    this.world = world;
};

/**
 * Function for sorting bodies along the X axis. To be passed to array.sort()
 * @method sortAxisListX
 * @param  {Body} bodyA
 * @param  {Body} bodyB
 * @return {Number}
 */
SAPBroadphase.sortAxisListX = function(bodyA,bodyB){
    return (bodyA.position[0]-bodyA.boundingRadius) - (bodyB.position[0]-bodyB.boundingRadius);
};

/**
 * Function for sorting bodies along the Y axis. To be passed to array.sort()
 * @method sortAxisListY
 * @param  {Body} bodyA
 * @param  {Body} bodyB
 * @return {Number}
 */
SAPBroadphase.sortAxisListY = function(bodyA,bodyB){
    return (bodyA.position[1]-bodyA.boundingRadius) - (bodyB.position[1]-bodyB.boundingRadius);
};

/**
 * Get the colliding pairs
 * @method getCollisionPairs
 * @param  {World} world
 * @return {Array}
 */
SAPBroadphase.prototype.getCollisionPairs = function(world){
    var bodies = this.axisList,
        result = this.result,
        axisIndex = this.axisIndex,
        i,j;

    result.length = 0;

    // Sort the list
    bodies.sort(axisIndex === 0 ? SAPBroadphase.sortAxisListX : SAPBroadphase.sortAxisListY );

    // Look through the list
    for(i=0, N=bodies.length; i!==N; i++){
        var bi = bodies[i];

        for(j=i+1; j<N; j++){
            var bj = bodies[j];

            if(!SAPBroadphase.checkBounds(bi,bj,axisIndex))
                break;

            // If we got overlap, add pair
            if(Broadphase.boundingRadiusCheck(bi,bj))
                result.push(bi,bj);
        }
    }

    return result;
};

/**
 * Check if the bounds of two bodies overlap, along the given SAP axis.
 * @static
 * @method checkBounds
 * @param  {Body} bi
 * @param  {Body} bj
 * @param  {Number} axisIndex
 * @return {Boolean}
 */
SAPBroadphase.checkBounds = function(bi,bj,axisIndex){
    var biPos = bi.position[axisIndex],
        ri = bi.boundingRadius,
        bjPos = bj.position[axisIndex],
        rj = bj.boundingRadius,
        boundA1 = biPos-ri,
        boundA2 = biPos+ri,
        boundB1 = bjPos-rj,
        boundB2 = bjPos+rj;

    return boundB1 < boundA2;
};