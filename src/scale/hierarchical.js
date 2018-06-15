'use strict';

import * as Chart from 'chart.js';

const defaultConfig = Object.assign({}, Chart.scaleService.getScaleDefaults('category'), {
	// TOOD
	levelPercentage: 0.3
});



const superClass = Chart.Scale;
const _super = superClass.prototype;

function prefix(arr, node) {
	arr.push(node);
	node.children.forEach((d) => prefix(arr, d));
	return arr;
}

const HierarchicalScale = superClass.extend({
	determineDataLimits() {
		const data = this.chart.data;


		const labels = this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels;

		this._nodes = labels.slice();

		this.minIndex = 0;
		this.maxIndex = this._nodes.length;
		this.min = this._nodes[this.minIndex];
		this.max = this._nodes[this.maxIndex];

		// 	this.options.barThickness = 'flex';
		// if (this.options.barThickness == null) {
		// 	this.options.barThickness = 50;
		// }
	},

	buildTicks() {
		const hor = this.isHorizontal();
		const total = hor ? this.width : this.height;

		const countPerLevel = [];
		this._nodes.forEach((node) => countPerLevel[node.level] = (countPerLevel[node.level] || 0) + 1);
		const ratio = this.options.levelPercentage;
		const slices = countPerLevel.reduce((acc, count, level) => acc + count * Math.pow(ratio, level), 0);

		const perSlice = total / slices;

		let offset = 0;
		this._nodes.forEach((node) => {
			const slice = perSlice * Math.pow(ratio, node.level);
			node.width = slice;
			node.center = offset + slice / 2;
			offset += slice;
		});

		return this.ticks = this._nodes;
	},

	convertTicksToLabels(ticks) {
		return ticks.map((d) => d.label);
	},

	getLabelForIndex(index, datasetIndex) {
		const data = this.chart.data;
		const isHorizontal = this.isHorizontal();

		if (data.yLabels && !isHorizontal) {
			return this.getRightValue(data.datasets[datasetIndex].data[index]);
		}
		return this._nodes[index - this.minIndex].label;
	},

	// Used to get data value locations.  Value can either be an index or a numerical value
	getPixelForValue(value, index) {
		const me = this;

		// If value is a data object, then index is the index in the data array,
		// not the index of the scale. We need to change that.
		{
			let valueCategory;
			if (value !== undefined && value !== null) {
				valueCategory = me.isHorizontal() ? value.x : value.y;
			}
			if (valueCategory !== undefined || (value !== undefined && isNaN(index))) {
				value = valueCategory || value;
				const idx = this._flatTree.findIndex((d) => d.label === value);
				index = idx !== -1 ? idx : index;
			}
		}

		const node = this._nodes[index];

		const centerTick = this.options.offset;

		const base = this.isHorizontal() ? this.left : this.top;

		return base + node.center - (centerTick ? 0 : node.width / 2);
	},
	getPixelForTick(index) {
		const node = this._nodes[index];
		const centerTick = this.options.offset;
		const base = this.isHorizontal() ? this.left : this.top;
		return base + node.center - (centerTick ? 0 : node.width / 2);
	},
	getValueForPixel(pixel) {
		return this._nodes.findIndex((d) => pixel >= d.center - d.width / 2 && pixel <= d.center + d.width / 2);
	},
	getBasePixel() {
		return this.bottom;
	}
});
Chart.scaleService.registerScaleType('hierarchical', HierarchicalScale, defaultConfig);

export default HierarchicalScale;
