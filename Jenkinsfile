pipeline {
    
agent any

	environment{
	    DOCKERHUB_CREDENTIALS=credentials('DOCKERLOGIN')
	}
	
stages {
	 stage('Docker') {
			agent any
			steps {
				sh 'echo $DOCKERHUB_CREDENTIALS_PSW | sudo docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
			}
		}
	    
	 stage('Docker Build') {
			
			steps {
			   sshagent(['DOCKERLOGIN']){
				sh 'ssh -o StrictHostKeyChecking=no opc@10.160.0.4 uptime'
				sh 'docker build -t nodejsimg1 .'
				sh 'docker images'
				
				}
			}
    }
	 stage('Deploy to K8S'){
		    steps{
			sshagent(['k8slogin']){
				script{
				try{
						sh 'ssh -o StrictHostKeyChecking=no opc@10.160.0.6 uptime'
						sh 'ssh opc@10.160.0.6 kubectl get pods -n an'
					}catch(error){
				
					}
				}
			 }
			}
		}
  }
  post {
		always {
			sh 'docker logout'
		}
	}
  
}
