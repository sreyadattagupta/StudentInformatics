const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path=require('path') 
const mysql=require('mysql2');
require('dotenv').config()
// Authentication middleware

const conn=mysql.createConnection(process.env.DATABASE_URL);
conn.connect((err)=>{
  console.log("Connected to MySQL PlanetScale Server");
})


module.exports.login = (req, res) => {
  // Check if the user exists in the database
  const id = req.body.id;
  const password = req.body.password;
  // console.log(req.body); 
  conn.query(`SELECT * FROM students WHERE id = '${id}' AND password = '${password}'`, (err, results) => {
    if (err) throw err;

    // If the user exists, create a JWT token and set it as a cookie
    if (results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ id: user.id }, config.get('jwtsecret'), { expiresIn: '1h' }); // Replace with your own token expiry time

      // Set the token as a cookie
      res.cookie('token', token);

      // Return the user data
      res.status(200).redirect('/student/dashboard');
    } else {
      // If the user does not exist, return an error
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
};

module.exports.studentDashboard = (req,res)=>{
    fs.readFile('./frontend/studentDashboard.html','utf-8',(err,data)=>{
        if(err){
            console.log(err);
            return res.status(500).send('Error reading file');
        }
        console.log(req.user);
        res.send(data);
    })
}

module.exports.courseRegister = (req,res)=>{
    fs.readFile('./frontend/courseRegister.html','utf-8',(err,data)=>{
        if(err){
            console.log(err);
            return res.status(500).send('Error reading file');
            // conn.query(`SELECT * FROM STUDENTS WHERE sem=`)
            
        }
        console.log(req.body);
        conn.query(`select * from course where sem=(select sem from students where id=${req.user.id}) and dept=(select dept from students where id=${req.user.id} and mandatory=1)`,(error,result)=>{
            if(error) throw error;
            // console.log(result);
            let html='';
            result.forEach((course) => {
              html+=`<label class="OP" for="mandatory"><input type="checkbox" name="courses" value="${course.coursecode}" checked disabled>${course.coursename}</input></label><br></br>`;
              html+=`<input type="hidden" name="courses" value="${course.coursecode}">`
            })
            const ans1=data.replace(/%mandatory%/g,html);
            conn.query(`select * from course where sem=(select sem from students where id=${req.user.id}) and dept=(select dept from students where id=${req.user.id} and mandatory=0)`,(error1,result1)=>{
                if(error1) throw error1;
                let html1='';
                result1.forEach((course) => {
                  html1+=`<label class="OP" for="optional"><input type="checkbox" name="courses" value="${course.coursecode}" checked>${course.coursename}</input></label><br></br>`;
                })

                const ans2=ans1.replace(/%nonmandatory%/g,html1);
                // console.log(ans2);
                res.send(ans2);
            });
        })
        // console.log(req.user);
        // res.send(data);
    })
}

module.exports.registerCourse = (req, res) => {
  const courseCodes = req.body.courses; // assuming the course codes are passed in the 'courses' array in the request body
  const studentId = req.user.id; // assuming the student ID is stored in req.user.id

  const insertQueries = courseCodes.map(courseCode => {
    return `INSERT INTO reg_courses VALUES(${studentId},'${courseCode}')`;
  });

  // join the insert queries into a single string
  let sql = insertQueries.join(";");
  sql+=";";
// console.log(sql);
  conn.query(sql, (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Error registering courses");
    }
    // console.log(result);
    res.send("Courses registered successfully");
  });
};

module.exports.loginPage = async (req,res) => {
  fs.readFile('./frontend/studentLogin.html','utf8',(err,data)=>{
   res.send(data);
  })
}
module.exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/student/login");
}

module.exports.studentDashboard = (req, res) => {
  const userId = req.user.id;
  const htmlFilePath = './frontend/studentDashboard.html';
  const sql = `SELECT * FROM students WHERE id = ${userId}`;
  const sql2 = `SELECT COUNT(*) as courseCount FROM reg_courses WHERE id = ${userId}`;

  conn.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Error retrieving student data from the database.');
    }

    if (result.length === 0) {
      return res.status(404).send('Student not found.');
    }

    const studentData = result[0];

    conn.query(sql2, (err2, result2) => {
      if (err2) {
        console.log(err2);
        return res.status(500).send('Error retrieving course count from the database.');
      }

      const courseCount = result2[0].courseCount;

      fs.readFile(htmlFilePath, 'utf-8', (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Error reading HTML file.');
        }

        const modifiedData = data
          .replace(/%name%/g, studentData.name)
          .replace(/%sem%/g, studentData.sem)
          .replace(/%cpi%/g, studentData.cpi)
          .replace(/%course%/g, courseCount);

        res.send(modifiedData);
      });
    });
  });
};

module.exports.getStudentCourses = (req, res) => {
  const studentId = req.user.id;
  const deptQuery = `SELECT dept FROM students WHERE id=${studentId}`;
  conn.query(deptQuery, (deptError, deptResult) => {
    if (deptError) throw deptError;

    const dept = deptResult[0].dept;
    const coursesQuery = `SELECT coursecode, coursename FROM course WHERE dept='${dept}' AND coursecode IN (SELECT coursecode FROM reg_courses WHERE id=${studentId})`;

    conn.query(coursesQuery, (error, result) => {
      if (error) throw error;

      let html = "";
      result.forEach((course) => {
        html += `<li>${course.coursecode} - ${course.coursename}</li>`;
      });

      const template = fs.readFileSync("./frontend/studentCourses.html", "utf-8");
      const output = template.replace(/%courses%/g, html);
      res.send(output);
    });
  });
};

