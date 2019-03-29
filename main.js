const hostname = "0.0.0.0";
const port = "3000";

const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const schedule = require('node-schedule');
const mysql = require("mysql");
const con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "aksfnghafjs1",
	database: "jolpro"
});
con.connect(function(err) {
	if(err) throw err;
});
const useragent = require("express-useragent");
const fs = require("fs");
const app = express();
app.use(useragent.express());
app.post("/", function(req, res, next) {
	con.query("SELECT DISTINCT title, link from gongji",function(err, result, fields) { // 공지때문에 중복이 생겨서 중복 제거
		res.send(result);
	});
});
//crawling
var j = schedule.scheduleJob('0 * * * *', function() { // 매 시간 0분에 실행
	request({ // request
		url: 'http://dept.inha.ac.kr/user/indexSub.do?codyMenuSeq=6669&siteId=ice',
		headers: {
		        'Host': 'dept.inha.ac.kr',
		        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
		}
	}, function(error, response, body) {
		let resultArr = [];
		let resultArr2 = [];
		const $ = cheerio.load(body);
		let colArr = $("#list_frm").find('table').find('tbody').find('tr').find('a').text().trim(); // title
		let colArr2 = $("#list_frm").find('table').find('tbody').find('tr').find('a'); // link
		var temp='';
		temp=colArr.split('\n').map(s=>s.trim());
		for(let i=0; i<temp.length; i++) {
			if(temp[i]!='') // 아무것도 없으면 건너뛴다
				resultArr.push(temp[i]);
		}
		console.log(resultArr);
		for(let i=0; i<colArr2.length; i++) {
			resultArr2.push(colArr2[i].attribs.href);
		}
		console.log(resultArr2);
		con.query("delete from gongji",function(err,result,fields) { // 한번 일괄삭제하고
			if(err) throw err;
			else {
				for(let i=0; i<resultArr.length; i++) {
					var params = [resultArr[i], resultArr2[i]];
					console.log(params);
					con.query("INSERT INTO gongji (title, link) VALUES (?,?)",params, function(err, result, fields) { // 새로 넣는다
						if(err) throw err;
						else
							console.log(result);
					});
				}
			}
		});	
	});
});

const server = app.listen(port, hostname, () => {
	console.log("Server running");
});
