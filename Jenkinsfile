pipeline {
	agent any
	stages {
  	
    stage('Docker Build') {
    	agent any
      steps {
        sh 'docker build -t fedimg1 .'
        sh 'docker images'
      }
    }
    stage('Docker') {
    	agent any
      steps {
      	withCredentials([usernamePassword(credentialsId: 'DOCKERLOGIN', passwordVariable: 'dockerHubPassword', usernameVariable: 'dockerHubUser')]) {
        	sh 'docker login -u ${env.dockerHubUser} -p "${env.dockerHubPassword}"'
          
        }
      }
    }
  }
}
