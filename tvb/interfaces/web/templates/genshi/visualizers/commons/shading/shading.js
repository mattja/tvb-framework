/**
 * TheVirtualBrain-Framework Package. This package holds all Data Management, and
 * Web-UI helpful to run brain-simulations. To use it, you also need do download
 * TheVirtualBrain-Scientific Package (for simulators). See content of the
 * documentation-folder for more details. See also http://www.thevirtualbrain.org
 *
 * (c) 2012-2013, Baycrest Centre for Geriatric Care ("Baycrest")
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License version 2 as published by the Free
 * Software Foundation. This program is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
 * License for more details. You should have received a copy of the GNU General
 * Public License along with this program; if not, you can download it here
 * http://www.gnu.org/licenses/old-licenses/gpl-2.
 *
 *   CITATION:
 * When using The Virtual Brain for scientific publications, please cite it as follows:
 *
 *   Paula Sanz Leon, Stuart A. Knock, M. Marmaduke Woodman, Lia Domide,
 *   Jochen Mersmann, Anthony R. McIntosh, Viktor Jirsa (2013)
 *       The Virtual Brain: a simulator of primate brain network dynamics.
 *   Frontiers in Neuroinformatics (7:10. doi: 10.3389/fninf.2013.00010)
 *
 * .. moduleauthor:: Mihai Andrei <mihai.andrei@codemart.ro>
 **/

/**
 * This file contains uniforms initialization for the shader fragments in this folder.
 * We decided that glsl fragments contain only functions and uniforms so that
 * in the shaders you can see the referenced attributes/varyings.
 *
 * This file also contains shader initialization, bulk uniform setters
 * and draw calls for the programs included in this folder.
 * One file to simplify js inclusion.
 */

/* globals gl*/

var SHADING_Context = SHADING_Context || {};

(function(){

/*** fragments ***/

SHADING_Context.transform_init = function(shader){
    shader.pMatrixUniform = gl.getUniformLocation(shader, "uPMatrix");
    shader.mvMatrixUniform = gl.getUniformLocation(shader, "uMVMatrix");
    shader.nMatrixUniform = gl.getUniformLocation(shader, "uNMatrix");
};

SHADING_Context.light_init = function(shader){
    shader.ambientColorUniform = gl.getUniformLocation(shader, "uAmbientColor");
    shader.lightingDirectionUniform = gl.getUniformLocation(shader, "uLightingDirection");
    shader.directionalColorUniform = gl.getUniformLocation(shader, "uDirectionalColor");
    shader.materialShininessUniform = gl.getUniformLocation(shader, "uMaterialShininess");
    shader.pointLightingLocationUniform = gl.getUniformLocation(shader, "uPointLightingLocation");
    shader.pointLightingSpecularColorUniform = gl.getUniformLocation(shader, "uPointLightingSpecularColor");
};

SHADING_Context.colorscheme_init = function (shader) {
    shader.activityRange = gl.getUniformLocation(shader, "activityRange");
    shader.activityBins = gl.getUniformLocation(shader, "activityBins");

    var g_texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, g_texture);

    var img = new Image();
    img.src = '/static/colorScheme/color_schemes.png';

    img.onload = function(){
        // filtering is not needed for this lookup texture
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // clamp to edge. This behaviour is needed by the lookup of out of range values.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // upload texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.uniform1i(gl.getUniformLocation(shader, "uSampler"), 0);
    };

    gl.uniform1i(gl.getUniformLocation(shader, "uSampler"), 0);
};

/*** programs ***/

SHADING_Context._init_geometric_attributes = function(shader){
    shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    shader.vertexNormalAttribute = gl.getAttribLocation(shader, "aVertexNormal");
	gl.enableVertexAttribArray(shader.vertexNormalAttribute);
};

/* These are used to draw the whole scene in a specific color ignoring vertex attributes.
 * For vertex level picking special color buffers are used.
 * This behaviour is used for measure point picking and to draw transparents and brain lines.
 */
SHADING_Context._init_whole_scene_coloring = function(shader){
    shader.useVertexColors = gl.getUniformLocation(shader, "uUseVertexColors");
    shader.materialColor = gl.getUniformLocation(shader, "uMaterialColor");
};

SHADING_Context._brain_common = function(shader){
    SHADING_Context._init_geometric_attributes(shader);
    SHADING_Context.transform_init(shader);
    SHADING_Context.light_init(shader);
    SHADING_Context.colorscheme_init(shader);
    SHADING_Context._init_whole_scene_coloring(shader);
};

/**
 * This atypical function initializes a minimal program. The initialization here is incomplete
 * Warning! This is used not with the fragments from the shading folder but with glsl inlined in templates.
 * Used by connectivity views.
 * @deprecated
 */
SHADING_Context.basic_program_init = function(shader){
    SHADING_Context._init_geometric_attributes(shader);
    SHADING_Context.transform_init(shader);
};

/** Init the program that uses per vertex activity and a color scheme */
SHADING_Context.one_to_one_program_init = function(shader){
    SHADING_Context._brain_common(shader);
    shader.colorSchemeUniform = gl.getUniformLocation(shader, "uColorScheme");
    shader.activityAttribute = gl.getAttribLocation(shader, "aActivity");
    gl.enableVertexAttribArray(shader.activityAttribute);
};

/** Init the program that uses per region activity and a color scheme */
SHADING_Context.region_progam_init = function(shader, measure_point_nr, legendGranularity){
    SHADING_Context._brain_common(shader);
    shader.vertexAlphaAttribute = gl.getAttribLocation(shader, "alpha");
    gl.enableVertexAttribArray(shader.vertexAlphaAttribute);
    shader.vertexColorIndicesAttribute = gl.getAttribLocation(shader, "alphaIndices");
    gl.enableVertexAttribArray(shader.vertexColorIndicesAttribute);

    shader.activityUniform = [];
    for (var i = 0; i <= measure_point_nr + 1 + legendGranularity; i++) {
        shader.activityUniform[i] = gl.getUniformLocation(shader, "uActivity[" + i + "]");
    }
};

/** Init the program that uses both a vertex activity and a vertex color */
SHADING_Context.surface_pick_init = function(shader){
    // vertex activity part
    SHADING_Context.one_to_one_program_init(shader);
    // vertex color part
    shader.useActivity =  gl.getUniformLocation(shader, "uUseActivity");
    shader.vertexColorAttribute = gl.getAttribLocation(shader, "aVertexColor");
    gl.enableVertexAttribArray(shader.vertexColorAttribute);
};

SHADING_Context.connectivity_init = function(shader){
    SHADING_Context._brain_common(shader);
    shader.colorAttribute = gl.getAttribLocation(shader, "aColor");
    gl.enableVertexAttribArray(shader.colorAttribute);

    shader.alphaUniform = gl.getUniformLocation(shader, "uAlpha");
};
/*** end initialization ***/

/*** start uniform setters ***/

SHADING_Context.transform_set_uniforms = function(shader, projectionMatrix, modelMatrix, normalMatrix){
    gl.uniformMatrix4fv(shader.pMatrixUniform, false, new Float32Array(projectionMatrix));
    gl.uniformMatrix4fv(shader.mvMatrixUniform, false, new Float32Array(modelMatrix));
    gl.uniformMatrix4fv(shader.nMatrixUniform, false, new Float32Array(normalMatrix));
};

SHADING_Context.light_set_uniforms = function(shader, s){
    gl.uniform3fv(shader.ambientColorUniform, s.ambientColor);
    gl.uniform3fv(shader.lightingDirectionUniform, s.lightDirection);
    gl.uniform3fv(shader.directionalColorUniform, s.directionalColor);
    gl.uniform1f(shader.materialShininessUniform, s.materialShininess);
    gl.uniform3fv(shader.pointLightingLocationUniform, s.pointLocation);
    gl.uniform3fv(shader.pointLightingSpecularColorUniform, s.specularColor);
};

SHADING_Context.colorscheme_set_uniforms = function(shader, min, max, bins) {
    gl.uniform2f(shader.activityRange, min, max);
    gl.uniform1f(shader.activityBins, bins);
};

/*** start draw calls for programs ***/
/* Note: the draw calls are tied to the shaders hence they are here. Buffer creation and uploading does not belong here */

SHADING_Context._bind_geometric_attributes = function(shader, positionBuffer, normalBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(shader.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
};

SHADING_Context.one_to_one_program_draw = function (shader, positionBuffer, normalBuffer,
                                                    activityBuffer, elementBuffer, drawMode){
    SHADING_Context._bind_geometric_attributes(shader, positionBuffer, normalBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, activityBuffer);
    gl.vertexAttribPointer(shader.activityAttribute, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.drawElements(drawMode, elementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

SHADING_Context.region_progam_draw = function (shader, positionBuffer, normalBuffer, alphaBuffer,
                                               alphaIndicesBuffer, elementBuffer, drawMode){
    SHADING_Context._bind_geometric_attributes(shader, positionBuffer, normalBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.vertexAttribPointer(shader.vertexAlphaAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaIndicesBuffer);
    gl.vertexAttribPointer(shader.vertexColorIndicesAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.drawElements(drawMode, elementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

SHADING_Context.surface_pick_draw = function (shader, positionBuffer, normalBuffer, colorBuffer,
                                              activityBuffer, elementBuffer, drawMode){
    SHADING_Context._bind_geometric_attributes(shader, positionBuffer, normalBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(shader.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, activityBuffer);
    gl.vertexAttribPointer(shader.activityAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.drawElements(drawMode, elementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

SHADING_Context.connectivity_draw = function(shader, positionBuffer, normalBuffer, colorBuffer, elementBuffer, drawMode){
    SHADING_Context._bind_geometric_attributes(shader, positionBuffer, normalBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(shader.colorAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.drawElements(drawMode, elementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

})();