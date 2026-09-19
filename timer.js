//get Time

function timer() {
	let a = new Date();
	let month = String(a.getMonth()+1).padStart(2,"0");
	let date = a.getDate();
	let hours = String(a.getHours()).padStart(2, "0");
	let minutes = String(a.getMinutes()).padStart(2, "0");
	let seconds = String(a.getSeconds()).padStart(2, "0");
	let time = `[ ${month}-${date} ${hours}:${minutes}:${seconds} ]`;
	return time;
}

module.exports = timer();
